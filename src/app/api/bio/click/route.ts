import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { nanoid } from 'nanoid'

function parseUserAgent(ua: string | null): { device: string; browser: string; os: string } {
  if (!ua) return { device: 'Unknown', browser: 'Unknown', os: 'Unknown' }

  let device = 'Desktop'
  if (/Mobile|Android|iPhone|iPad|iPod/i.test(ua)) device = 'Mobile'
  else if (/Tablet|iPad/i.test(ua)) device = 'Tablet'

  let browser = 'Unknown'
  if (/Firefox/i.test(ua)) browser = 'Firefox'
  else if (/Edg/i.test(ua)) browser = 'Edge'
  else if (/Chrome/i.test(ua)) browser = 'Chrome'
  else if (/Safari/i.test(ua)) browser = 'Safari'

  let os = 'Unknown'
  if (/Windows/i.test(ua)) os = 'Windows'
  else if (/Mac OS X/i.test(ua)) os = 'macOS'
  else if (/Android/i.test(ua)) os = 'Android'
  else if (/iPhone|iPad/i.test(ua)) os = 'iOS'
  else if (/Linux/i.test(ua)) os = 'Linux'

  return { device, browser, os }
}

export async function POST(req: NextRequest) {
  try {
    const { itemId } = await req.json()
    if (!itemId) return NextResponse.json({ error: 'itemId required' }, { status: 400 })

    const { data: item } = await supabaseAdmin
      .from('BioPageItem')
      .select('bioPageId, clicks')
      .eq('id', itemId)
      .single()

    if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 })

    const { data: page } = await supabaseAdmin
      .from('BioPage')
      .select('clicksTotal')
      .eq('id', item.bioPageId)
      .single()

    const ua = req.headers.get('user-agent') || ''
    const { device, browser, os } = parseUserAgent(ua)
    const country  = req.headers.get('x-vercel-ip-country') || req.headers.get('cf-ipcountry') || null
    const city     = req.headers.get('x-vercel-ip-city')    || req.headers.get('cf-ipcity')    || null
    const region   = req.headers.get('x-vercel-ip-region')  || req.headers.get('cf-region')    || null
    const referrer = req.headers.get('referer') || null
    const now = new Date().toISOString()

    await Promise.all([
      supabaseAdmin
        .from('BioPageItem')
        .update({ clicks: (item.clicks || 0) + 1 })
        .eq('id', itemId),
      supabaseAdmin
        .from('BioPage')
        .update({ clicksTotal: (page?.clicksTotal || 0) + 1 })
        .eq('id', item.bioPageId),
      supabaseAdmin.from('BioPageClick').insert({
        id: nanoid(), bioPageId: item.bioPageId, itemId,
        country, city, region, device, browser, os, referrer,
        userAgent: ua, timestamp: now,
      }),
    ])

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}
