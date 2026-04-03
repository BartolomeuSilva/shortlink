import { supabaseAdmin } from '@/lib/supabase'

export async function compareLinks(userId: string, linkIds: string[]) {
  if (linkIds.length === 0) return { summary: [] }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const { data: links } = await supabaseAdmin
    .from('Link')
    .select('id, title, shortCode, originalUrl, clickCount, createdAt')
    .in('id', linkIds)
    .eq('userId', userId)

  if (!links?.length) return { summary: [] }

  const summary = await Promise.all(
    links.map(async (link: any) => {
      const [{ count: totalClicks }, { count: prevClicks }, { data: unique }] = await Promise.all([
        supabaseAdmin.from('Click').select('*', { count: 'exact', head: true }).eq('linkId', link.id),
        supabaseAdmin.from('Click').select('*', { count: 'exact', head: true }).eq('linkId', link.id).lt('timestamp', thirtyDaysAgo),
        supabaseAdmin.from('Click').select('ipHash').eq('linkId', link.id),
      ])

      const total = totalClicks || 0
      const prev = prevClicks || 0
      const uniqueVisitors = new Set((unique || []).map((c: any) => c.ipHash)).size
      const ctr = total > 0 ? Math.round(((total - prev) / total) * 100) : 0

      return {
        id: link.id,
        title: link.title,
        shortCode: link.shortCode,
        originalUrl: link.originalUrl,
        totalClicks: total,
        uniqueVisitors,
        createdAt: link.createdAt,
        ctr: Math.abs(ctr),
      }
    })
  )

  return { summary }
}
