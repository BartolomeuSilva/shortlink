import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const linkId = searchParams.get('linkId')
  const period = searchParams.get('period') || '7d'
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')

  if (!linkId) return NextResponse.json({ error: 'linkId é obrigatório' }, { status: 400 })

  const { data: link } = await supabaseAdmin
    .from('Link')
    .select('id, clickCount')
    .eq('id', linkId)
    .single()

  if (!link) return NextResponse.json({ error: 'Link não encontrado' }, { status: 404 })

  const now = new Date()
  const periodMap: Record<string, number> = { '24h': 1, '7d': 7, '30d': 30, '90d': 90 }
  const days = periodMap[period] ?? 7
  const dateFrom = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString()

  const offset = (page - 1) * limit

  const [
    { data: clicks, count: totalClicks },
    { data: countryStats },
    { data: deviceStats },
    { data: browserStats },
    { data: osStats },
    { data: refererStats },
    { data: timeline },
  ] = await Promise.all([
    supabaseAdmin
      .from('Click')
      .select('*', { count: 'exact' })
      .eq('linkId', linkId)
      .gte('timestamp', dateFrom)
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1),
    supabaseAdmin.rpc('click_group_by', { p_link_id: linkId, p_since: dateFrom, p_field: 'country', p_limit: 20 }),
    supabaseAdmin.rpc('click_group_by', { p_link_id: linkId, p_since: dateFrom, p_field: 'deviceType', p_limit: 10 }),
    supabaseAdmin.rpc('click_group_by', { p_link_id: linkId, p_since: dateFrom, p_field: 'browser', p_limit: 10 }),
    supabaseAdmin.rpc('click_group_by', { p_link_id: linkId, p_since: dateFrom, p_field: 'os', p_limit: 10 }),
    supabaseAdmin.rpc('click_group_by', { p_link_id: linkId, p_since: dateFrom, p_field: 'referer', p_limit: 10 }),
    supabaseAdmin.rpc('click_timeline', { p_link_id: linkId, p_since: dateFrom }),
  ])

  const total = totalClicks || 0

  return NextResponse.json({
    summary: { totalClicks: total, linkClickCount: link.clickCount, periodStart: dateFrom, periodEnd: now },
    clicks: (clicks || []).map(c => ({ ...c, timestamp: c.timestamp })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    analytics: {
      byCountry:  (countryStats  || []).map((r: any) => ({ country: r.value,  clicks: r.clicks })),
      byDevice:   (deviceStats   || []).map((r: any) => ({ device:  r.value,  clicks: r.clicks })),
      byBrowser:  (browserStats  || []).map((r: any) => ({ browser: r.value,  clicks: r.clicks })),
      byOs:       (osStats       || []).map((r: any) => ({ os:      r.value,  clicks: r.clicks })),
      byReferer:  (refererStats  || []).map((r: any) => ({ referer: r.value,  clicks: r.clicks })),
      timeline:   (timeline      || []).map((t: any) => ({ date:    t.date,   clicks: t.clicks })),
    },
  })
}
