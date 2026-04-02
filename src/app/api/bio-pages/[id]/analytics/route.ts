import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const bio = await prisma.bioPage.findUnique({ where: { id: params.id } })
  if (!bio || bio.userId !== session.user.id) {
    return NextResponse.json({ error: 'Bio não encontrada' }, { status: 404 })
  }

  const { searchParams } = new URL(req.url)
  const days = parseInt(searchParams.get('days') || '30')
  const since = new Date()
  since.setDate(since.getDate() - days)

  // Time series data
  const clicksByDay = await prisma.$queryRaw<Array<{ date: string; clicks: number }>>`
    SELECT DATE("timestamp")::text as date, COUNT(*)::int as clicks
    FROM "BioPageClick"
    WHERE "bioPageId" = ${params.id} AND "timestamp" >= ${since}
    GROUP BY DATE("timestamp")
    ORDER BY date ASC
  `

  // Device breakdown
  const deviceBreakdown = await prisma.$queryRaw<Array<{ device: string; clicks: number }>>`
    SELECT COALESCE(device, 'Unknown') as device, COUNT(*)::int as clicks
    FROM "BioPageClick"
    WHERE "bioPageId" = ${params.id} AND "timestamp" >= ${since}
    GROUP BY device
    ORDER BY clicks DESC
  `

  // Browser breakdown
  const browserBreakdown = await prisma.$queryRaw<Array<{ browser: string; clicks: number }>>`
    SELECT COALESCE(browser, 'Unknown') as browser, COUNT(*)::int as clicks
    FROM "BioPageClick"
    WHERE "bioPageId" = ${params.id} AND "timestamp" >= ${since}
    GROUP BY browser
    ORDER BY clicks DESC
  `

  // OS breakdown
  const osBreakdown = await prisma.$queryRaw<Array<{ os: string; clicks: number }>>`
    SELECT COALESCE(os, 'Unknown') as os, COUNT(*)::int as clicks
    FROM "BioPageClick"
    WHERE "bioPageId" = ${params.id} AND "timestamp" >= ${since}
    GROUP BY os
    ORDER BY clicks DESC
  `

  // Country breakdown
  const countryBreakdown = await prisma.$queryRaw<Array<{ country: string; clicks: number }>>`
    SELECT COALESCE(country, 'Unknown') as country, COUNT(*)::int as clicks
    FROM "BioPageClick"
    WHERE "bioPageId" = ${params.id} AND "timestamp" >= ${since}
    GROUP BY country
    ORDER BY clicks DESC
    LIMIT 10
  `

  // Referrer breakdown
  const referrerBreakdown = await prisma.$queryRaw<Array<{ referrer: string; clicks: number }>>`
    SELECT COALESCE(referrer, 'Direct') as referrer, COUNT(*)::int as clicks
    FROM "BioPageClick"
    WHERE "bioPageId" = ${params.id} AND "timestamp" >= ${since}
    GROUP BY referrer
    ORDER BY clicks DESC
    LIMIT 10
  `

  // Top items by clicks
  const topItems = await prisma.bioPageItem.findMany({
    where: { bioPageId: params.id },
    orderBy: { clicks: 'desc' },
    select: { id: true, label: true, icon: true, clicks: true },
  })

  // Hour of day heatmap
  const hourData = await prisma.$queryRaw<Array<{ hour: number; clicks: number }>>`
    SELECT EXTRACT(HOUR FROM "timestamp")::int as hour, COUNT(*)::int as clicks
    FROM "BioPageClick"
    WHERE "bioPageId" = ${params.id} AND "timestamp" >= ${since}
    GROUP BY hour
    ORDER BY hour ASC
  `

  return NextResponse.json({
    chartData: clicksByDay,
    devices: deviceBreakdown,
    browsers: browserBreakdown,
    os: osBreakdown,
    countries: countryBreakdown,
    referrers: referrerBreakdown,
    topItems,
    hourData,
    summary: {
      totalClicks: bio.clicksTotal,
      totalItems: topItems.length,
      topCountry: countryBreakdown[0]?.country || 'N/A',
      topDevice: deviceBreakdown[0]?.device || 'N/A',
      topBrowser: browserBreakdown[0]?.browser || 'N/A',
    },
  })
}
