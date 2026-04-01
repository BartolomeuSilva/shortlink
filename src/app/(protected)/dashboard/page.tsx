import { Suspense } from 'react'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { formatNumber } from '@/lib/utils'
import { DashboardClient } from './DashboardClient'
import { subDays, startOfDay } from 'date-fns'

async function getDashboardData(userId: string) {
  const now = new Date()
  const thirtyDaysAgo = startOfDay(subDays(now, 29))
  const sevenDaysAgo = startOfDay(subDays(now, 6))
  const prevThirtyStart = startOfDay(subDays(now, 59))

  const [
    totalLinks,
    activeLinks,
    totalClicks,
    prevPeriodClicks,
    recentLinks,
    clicksByDay,
    clicksByCountry,
    clicksByDevice,
  ] = await Promise.all([
    prisma.link.count({ where: { userId } }),
    prisma.link.count({ where: { userId, isActive: true } }),
    prisma.click.count({
      where: {
        link: { userId },
        timestamp: { gte: thirtyDaysAgo },
      },
    }),
    prisma.click.count({
      where: {
        link: { userId },
        timestamp: { gte: prevThirtyStart, lt: thirtyDaysAgo },
      },
    }),
    prisma.link.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { _count: { select: { clicks: true } } },
    }),
    prisma.click.groupBy({
      by: ['timestamp'],
      where: {
        link: { userId },
        timestamp: { gte: thirtyDaysAgo },
      },
      _count: true,
    }),
    prisma.click.groupBy({
      by: ['country', 'countryCode'],
      where: {
        link: { userId },
        timestamp: { gte: thirtyDaysAgo },
        country: { not: null },
      },
      _count: { _all: true },
      orderBy: { _count: { country: 'desc' } },
      take: 5,
    }),
    prisma.click.groupBy({
      by: ['deviceType'],
      where: {
        link: { userId },
        timestamp: { gte: thirtyDaysAgo },
      },
      _count: { _all: true },
      orderBy: { _count: { deviceType: 'desc' } },
    }),
  ])

  // Build clicks by day map
  const clickMap = new Map<string, number>()
  for (const row of clicksByDay) {
    const day = row.timestamp.toISOString().split('T')[0]
    clickMap.set(day, (clickMap.get(day) || 0) + row._count)
  }

  const chartData: { date: string; clicks: number }[] = []
  for (let i = 29; i >= 0; i--) {
    const d = startOfDay(subDays(now, i))
    const key = d.toISOString().split('T')[0]
    chartData.push({ date: key, clicks: clickMap.get(key) || 0 })
  }

  const delta = prevPeriodClicks > 0
    ? Math.round(((totalClicks - prevPeriodClicks) / prevPeriodClicks) * 100)
    : totalClicks > 0 ? 100 : 0

  // Weekly clicks for quick stat
  const weeklyClicks = await prisma.click.count({
    where: {
      link: { userId },
      timestamp: { gte: sevenDaysAgo },
    },
  })

  return {
    metrics: {
      totalClicks,
      delta,
      activeLinks,
      totalLinks,
      weeklyClicks,
    },
    chartData,
    recentLinks: recentLinks.map((l) => ({
      id: l.id,
      shortCode: l.shortCode,
      originalUrl: l.originalUrl,
      title: l.title,
      clickCount: l._count.clicks,
      isActive: l.isActive,
      createdAt: l.createdAt.toISOString(),
    })),
    geoData: clicksByCountry.map((g) => ({
      country: g.country || 'Desconhecido',
      countryCode: g.countryCode,
      clicks: g._count._all,
    })),
    deviceData: clicksByDevice.map((d) => ({
      deviceType: d.deviceType,
      clicks: d._count._all,
    })),
  }
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const data = await getDashboardData(session.user.id)

  return (
    <DashboardClient
      metrics={data.metrics}
      chartData={data.chartData}
      recentLinks={data.recentLinks}
      geoData={data.geoData}
      deviceData={data.deviceData}
      userName={session.user.name || session.user.email?.split('@')[0] || 'Usuário'}
    />
  )
}
