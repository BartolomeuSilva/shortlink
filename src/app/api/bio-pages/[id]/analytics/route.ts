import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: bio } = await supabaseAdmin
    .from('BioPage')
    .select('id, userId, clicksTotal')
    .eq('id', params.id)
    .single()

  if (!bio || bio.userId !== session.user.id) return NextResponse.json({ error: 'Bio não encontrada' }, { status: 404 })

  const { searchParams } = new URL(req.url)
  const days = parseInt(searchParams.get('days') || '30')
  const since = new Date()
  since.setDate(since.getDate() - days)
  const sinceIso = since.toISOString()

  const [
    { data: clicksRaw },
    { data: topItems },
  ] = await Promise.all([
    supabaseAdmin
      .from('BioPageClick')
      .select('timestamp, device, browser, os, country, referrer')
      .eq('bioPageId', params.id)
      .gte('timestamp', sinceIso),
    supabaseAdmin
      .from('BioPageItem')
      .select('id, label, icon, clicks')
      .eq('bioPageId', params.id)
      .order('clicks', { ascending: false }),
  ])

  const clicks = clicksRaw || []

  // Aggregate in JS (avoids needing Supabase RPC)
  const byDay: Record<string, number> = {}
  const byDevice: Record<string, number> = {}
  const byBrowser: Record<string, number> = {}
  const byOs: Record<string, number> = {}
  const byCountry: Record<string, number> = {}
  const byReferrer: Record<string, number> = {}
  const byHour: Record<number, number> = {}

  for (const c of clicks) {
    const date = c.timestamp?.slice(0, 10) || ''
    byDay[date] = (byDay[date] || 0) + 1

    const device = c.device || 'Unknown'
    byDevice[device] = (byDevice[device] || 0) + 1

    const browser = c.browser || 'Unknown'
    byBrowser[browser] = (byBrowser[browser] || 0) + 1

    const os = c.os || 'Unknown'
    byOs[os] = (byOs[os] || 0) + 1

    const country = c.country || 'Unknown'
    byCountry[country] = (byCountry[country] || 0) + 1

    const referrer = c.referrer || 'Direct'
    byReferrer[referrer] = (byReferrer[referrer] || 0) + 1

    const hour = new Date(c.timestamp).getHours()
    byHour[hour] = (byHour[hour] || 0) + 1
  }

  const toArr = (obj: Record<string, number>, key: string) =>
    Object.entries(obj).map(([value, count]) => ({ [key]: value, clicks: count }))
      .sort((a, b) => b.clicks - a.clicks)

  return NextResponse.json({
    chartData: Object.entries(byDay).sort().map(([date, clicks]) => ({ date, clicks })),
    devices:   toArr(byDevice, 'device'),
    browsers:  toArr(byBrowser, 'browser'),
    os:        toArr(byOs, 'os'),
    countries: toArr(byCountry, 'country').slice(0, 10),
    referrers: toArr(byReferrer, 'referrer').slice(0, 10),
    hourData:  Array.from({ length: 24 }, (_, h) => ({ hour: h, clicks: byHour[h] || 0 })),
    topItems:  topItems || [],
    summary: {
      totalClicks: bio.clicksTotal,
      totalItems: topItems?.length || 0,
      topCountry: toArr(byCountry, 'country')[0]?.country || 'N/A',
      topDevice:  toArr(byDevice, 'device')[0]?.device || 'N/A',
      topBrowser: toArr(byBrowser, 'browser')[0]?.browser || 'N/A',
    },
  })
}
