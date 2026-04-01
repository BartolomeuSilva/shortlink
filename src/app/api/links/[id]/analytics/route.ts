import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { subDays, startOfDay, endOfDay } from 'date-fns'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const period = parseInt(searchParams.get('period') || '30')
  const { id: linkId } = params

  const link = await prisma.link.findFirst({
    where: { id: linkId, userId: session.user.id },
  })

  if (!link) {
    return NextResponse.json({ error: 'Link não encontrado' }, { status: 404 })
  }

  const startDate = startOfDay(subDays(new Date(), period))
  const endDate = endOfDay(new Date())

  const [clicks, totalCount, uniqueVisitors] = await Promise.all([
    prisma.click.findMany({
      where: {
        linkId,
        timestamp: { gte: startDate, lte: endDate },
      },
      orderBy: { timestamp: 'desc' },
    }),
    prisma.click.count({
      where: { linkId, timestamp: { gte: startDate, lte: endDate } },
    }),
    prisma.click.groupBy({
      by: ['ipHash'],
      where: { linkId, timestamp: { gte: startDate, lte: endDate } },
      _count: true,
    }),
  ])

  const clicksByDay: Record<string, number> = {}
  const clicksByHour: Record<number, number> = {}
  for (let i = 0; i < 24; i++) {
    clicksByHour[i] = 0
  }
  const clicksByCountry: Record<string, number> = {}
  const clicksByDevice: Record<string, number> = {}
  const clicksByBrowser: Record<string, number> = {}
  const clicksByOS: Record<string, number> = {}
  const botClicks: string[] = []

  const botPatterns = [
    /bot/i, /spider/i, /crawler/i, /curl/i, /wget/i,
    /python-requests/i, /httpclient/i, /axios/i,
    /headless/i, /puppeteer/i, /selenium/i,
  ]

  for (const click of clicks) {
    const day = click.timestamp.toISOString().split('T')[0]
    const hour = click.timestamp.getHours()

    clicksByDay[day] = (clicksByDay[day] || 0) + 1
    clicksByHour[hour] = (clicksByHour[hour] || 0) + 1

    if (click.country) {
      clicksByCountry[click.country] = (clicksByCountry[click.country] || 0) + 1
    }
    if (click.deviceType) {
      clicksByDevice[click.deviceType] = (clicksByDevice[click.deviceType] || 0) + 1
    }
    if (click.browser) {
      clicksByBrowser[click.browser] = (clicksByBrowser[click.browser] || 0) + 1
    }
    if (click.os) {
      clicksByOS[click.os] = (clicksByOS[click.os] || 0) + 1
    }

    const ua = click.userAgent || ''
    if (botPatterns.some(pattern => pattern.test(ua))) {
      botClicks.push(click.id)
    }
  }

  const topReferers = clicks
    .filter(c => c.referer)
    .reduce((acc, c) => {
      const ref = new URL(c.referer || '').hostname
      if (ref) {
        acc[ref] = (acc[ref] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)

  const chartData = Object.entries(clicksByDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, clicks]) => ({ date, clicks }))

  const hourlyData = Object.entries(clicksByHour).map(([hour, clicks]) => ({ hour: parseInt(hour), clicks }))

  return NextResponse.json({
    summary: {
      totalClicks: totalCount,
      uniqueVisitors: uniqueVisitors.length,
      botClicks: botClicks.length,
      bounceRate: totalCount > 0 ? Math.round((botClicks.length / totalCount) * 100) : 0,
    },
    chartData,
    hourlyData,
    clicksByCountry: Object.entries(clicksByCountry)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([country, clicks]) => ({ country, clicks })),
    clicksByDevice: Object.entries(clicksByDevice)
      .map(([device, clicks]) => ({ device, clicks }))
      .sort((a, b) => b.clicks - a.clicks),
    clicksByBrowser: Object.entries(clicksByBrowser)
      .map(([browser, clicks]) => ({ browser, clicks }))
      .sort((a, b) => b.clicks - a.clicks),
    clicksByOS: Object.entries(clicksByOS)
      .map(([os, clicks]) => ({ os, clicks }))
      .sort((a, b) => b.clicks - a.clicks),
    topReferers: Object.entries(topReferers)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([referer, clicks]) => ({ referer, clicks })),
  })
}
