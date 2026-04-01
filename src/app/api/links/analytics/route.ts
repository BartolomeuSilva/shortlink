import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const linkId = searchParams.get('linkId')
  const period = searchParams.get('period') || '7d'
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')

  if (!linkId) {
    return NextResponse.json({ error: 'linkId é obrigatório' }, { status: 400 })
  }

  const link = await prisma.link.findUnique({
    where: { id: linkId },
    select: { id: true, clickCount: true },
  })

  if (!link) {
    return NextResponse.json({ error: 'Link não encontrado' }, { status: 404 })
  }

  let dateFrom: Date
  const now = new Date()

  switch (period) {
    case '24h':
      dateFrom = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      break
    case '7d':
      dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case '30d':
      dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      break
    case '90d':
      dateFrom = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      break
    default:
      dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  }

  const skip = (page - 1) * limit

  const [clicks, totalClicks, countryStats, deviceStats, browserStats, osStats, refererStats] = await Promise.all([
    prisma.click.findMany({
      where: {
        linkId,
        timestamp: { gte: dateFrom },
      },
      orderBy: { timestamp: 'desc' },
      skip,
      take: limit,
    }),
    prisma.click.count({
      where: {
        linkId,
        timestamp: { gte: dateFrom },
      },
    }),
    prisma.click.groupBy({
      by: ['country'],
      where: {
        linkId,
        timestamp: { gte: dateFrom },
        country: { not: null },
      },
      _count: true,
      orderBy: { _count: { country: 'desc' } },
      take: 20,
    }),
    prisma.click.groupBy({
      by: ['deviceType'],
      where: {
        linkId,
        timestamp: { gte: dateFrom },
      },
      _count: true,
    }),
    prisma.click.groupBy({
      by: ['browser'],
      where: {
        linkId,
        timestamp: { gte: dateFrom },
        browser: { not: null },
      },
      _count: true,
      orderBy: { _count: { browser: 'desc' } },
      take: 10,
    }),
    prisma.click.groupBy({
      by: ['os'],
      where: {
        linkId,
        timestamp: { gte: dateFrom },
        os: { not: null },
      },
      _count: true,
      orderBy: { _count: { os: 'desc' } },
      take: 10,
    }),
    prisma.click.groupBy({
      by: ['referer'],
      where: {
        linkId,
        timestamp: { gte: dateFrom },
        referer: { not: null },
      },
      _count: true,
      orderBy: { _count: { referer: 'desc' } },
      take: 10,
    }),
  ])

  const timeline = await prisma.$queryRaw<{ date: string; count: bigint }[]>`
    SELECT DATE(timestamp) as date, COUNT(*)::bigint as count
    FROM "Click"
    WHERE link_id = ${linkId}
      AND timestamp >= ${dateFrom}
    GROUP BY DATE(timestamp)
    ORDER BY date
  `

  return NextResponse.json({
    summary: {
      totalClicks,
      linkClickCount: link.clickCount,
      periodStart: dateFrom,
      periodEnd: now,
    },
    clicks: clicks.map(c => ({
      ...c,
      timestamp: c.timestamp.toISOString(),
    })),
    pagination: {
      page,
      limit,
      total: totalClicks,
      totalPages: Math.ceil(totalClicks / limit),
    },
    analytics: {
      byCountry: countryStats.map(c => ({
        country: c.country,
        clicks: c._count,
      })),
      byDevice: deviceStats.map(d => ({
        device: d.deviceType,
        clicks: d._count,
      })),
      byBrowser: browserStats.map(b => ({
        browser: b.browser,
        clicks: b._count,
      })),
      byOs: osStats.map(o => ({
        os: o.os,
        clicks: o._count,
      })),
      byReferer: refererStats.map(r => ({
        referer: r.referer,
        clicks: r._count,
      })),
      timeline: timeline.map(t => ({
        date: t.date,
        clicks: Number(t.count),
      })),
    },
  })
}
