import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [
    totalLinks,
    totalClicks,
    recentLinks,
    clicksByDay,
    topCountries,
    topDevices,
    recentClicks,
  ] = await Promise.all([
    prisma.link.count({ where: { userId } }),
    prisma.link.aggregate({
      where: { userId },
      _sum: { clickCount: true },
    }),
    prisma.link.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { _count: { select: { clicks: true } } },
    }),
    prisma.$queryRaw<{ date: Date; count: bigint }[]>`
      SELECT DATE(c."timestamp") as date, COUNT(*)::bigint as count
      FROM "Click" c
      JOIN "Link" l ON c."linkId" = l.id
      WHERE l."userId" = ${userId}
        AND c."timestamp" >= ${thirtyDaysAgo}
      GROUP BY DATE(c."timestamp")
      ORDER BY date
    `,
    prisma.$queryRaw<{ country: string; count: bigint }[]>`
      SELECT c.country, COUNT(*)::bigint as count
      FROM "Click" c
      JOIN "Link" l ON c."linkId" = l.id
      WHERE l."userId" = ${userId}
        AND c.country IS NOT NULL
      GROUP BY c.country
      ORDER BY count DESC
      LIMIT 5
    `,
    prisma.$queryRaw<{ device: string; count: bigint }[]>`
      SELECT c."deviceType" as device, COUNT(*)::bigint as count
      FROM "Click" c
      JOIN "Link" l ON c."linkId" = l.id
      WHERE l."userId" = ${userId}
      GROUP BY c."deviceType"
      ORDER BY count DESC
    `,
    prisma.click.findMany({
      where: {
        link: { userId },
      },
      orderBy: { timestamp: 'desc' },
      take: 10,
      include: {
        link: {
          select: { shortCode: true, title: true },
        },
      },
    }),
  ])

  return NextResponse.json({
    summary: {
      totalLinks,
      totalClicks: totalClicks._sum.clickCount || 0,
      avgClicksPerLink: totalLinks > 0 ? Math.round((totalClicks._sum.clickCount || 0) / totalLinks) : 0,
    },
    recentLinks: recentLinks.map(l => ({
      id: l.id,
      shortCode: l.shortCode,
      title: l.title,
      clickCount: l._count.clicks,
      createdAt: l.createdAt,
    })),
    clicksByDay: clicksByDay.map(d => ({
      date: d.date,
      clicks: Number(d.count),
    })),
    topCountries: topCountries.map(c => ({
      country: c.country,
      clicks: Number(c.count),
    })),
    topDevices: topDevices.map(d => ({
      device: d.device,
      clicks: Number(d.count),
    })),
    recentClicks: recentClicks.map(c => ({
      id: c.id,
      timestamp: c.timestamp,
      country: c.country,
      deviceType: c.deviceType,
      link: c.link,
    })),
  })
}
