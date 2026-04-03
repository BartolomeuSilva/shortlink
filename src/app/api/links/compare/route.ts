import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const ids = searchParams.get('ids')?.split(',').filter(Boolean) || []

  if (ids.length === 0) return NextResponse.json({ summary: [] })

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const { data: links } = await supabaseAdmin
    .from('Link')
    .select('id, title, shortCode, originalUrl, clickCount, createdAt')
    .in('id', ids)
    .eq('userId', session.user.id)

  if (!links?.length) return NextResponse.json({ summary: [] })

  const summary = await Promise.all(
    links.map(async (link) => {
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

  return NextResponse.json({ summary })
}
