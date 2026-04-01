import { prisma } from '@/lib/db'
import { subDays } from 'date-fns'

export async function compareLinks(userId: string, linkIds: string[]) {
  if (linkIds.length === 0) {
    return { summary: [] }
  }

  const thirtyDaysAgo = subDays(new Date(), 30)

  const links = await prisma.link.findMany({
    where: { id: { in: linkIds }, userId },
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
        createdAt: link.createdAt,
        ctr: Math.abs(ctr),
      }
    })
  )

  return { summary }
}
