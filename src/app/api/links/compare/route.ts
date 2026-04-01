import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { subDays } from 'date-fns'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const ids = searchParams.get('ids')?.split(',').filter(Boolean) || []

  if (ids.length === 0) {
    return NextResponse.json({ summary: [] })
  }

  const thirtyDaysAgo = subDays(new Date(), 30)

  const links = await prisma.link.findMany({
    where: { id: { in: ids }, userId: session.user.id },
  })

  const summary = await Promise.all(
    links.map(async (link) => {
      const [totalClicks, uniqueVisitors, prevPeriodClicks] = await Promise.all([
        prisma.click.count({ where: { linkId: link.id } }),
        prisma.click.groupBy({
          by: ['ipHash'],
          where: { linkId: link.id },
          _count: true,
        }),
        prisma.click.count({
          where: {
            linkId: link.id,
            timestamp: { lt: thirtyDaysAgo },
          },
        }),
      ])

      const ctr = totalClicks > 0
        ? Math.round(((totalClicks - prevPeriodClicks) / totalClicks) * 100)
        : 0

      return {
        id: link.id,
        title: link.title,
        shortCode: link.shortCode,
        originalUrl: link.originalUrl,
        totalClicks,
        uniqueVisitors: uniqueVisitors.length,
        createdAt: link.createdAt.toISOString(),
        ctr: Math.abs(ctr),
      }
    })
  )

  return NextResponse.json({ summary })
}
