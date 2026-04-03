import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(_request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { data: links },
    { data: recentLinks },
    { data: recentClicks },
    { data: clicksByDay },
    { data: topCountries },
    { data: topDevices },
  ] = await Promise.all([
    supabaseAdmin
      .from('Link')
      .select('id, clickCount')
      .eq('userId', userId),
    supabaseAdmin
      .from('Link')
      .select('id, shortCode, title, clickCount, createdAt')
      .eq('userId', userId)
      .order('createdAt', { ascending: false })
      .limit(10),
    supabaseAdmin
      .from('Click')
      .select('id, timestamp, country, deviceType, linkId, Link!inner(shortCode, title, userId)')
      .eq('Link.userId', userId)
      .order('timestamp', { ascending: false })
      .limit(10),
    supabaseAdmin.rpc('clicks_by_day', { p_user_id: userId, p_since: thirtyDaysAgo }),
    supabaseAdmin.rpc('top_countries', { p_user_id: userId }),
    supabaseAdmin.rpc('top_devices', { p_user_id: userId }),
  ])

  const allLinks = links || []
  const totalLinks = allLinks.length
  const totalClicks = allLinks.reduce((s, l) => s + (l.clickCount || 0), 0)

  return NextResponse.json({
    summary: {
      totalLinks,
      totalClicks,
      avgClicksPerLink: totalLinks > 0 ? Math.round(totalClicks / totalLinks) : 0,
    },
    recentLinks: (recentLinks || []).map(l => ({
      id: l.id,
      shortCode: l.shortCode,
      title: l.title,
      clickCount: l.clickCount,
      createdAt: l.createdAt,
    })),
    clicksByDay: (clicksByDay || []).map((d: any) => ({ date: d.date, clicks: Number(d.clicks) })),
    topCountries: (topCountries || []).map((c: any) => ({ country: c.country, clicks: Number(c.clicks) })),
    topDevices: (topDevices || []).map((d: any) => ({ device: d.device, clicks: Number(d.clicks) })),
    recentClicks: (recentClicks || []).map((c: any) => ({
      id: c.id,
      timestamp: c.timestamp,
      country: c.country,
      deviceType: c.deviceType,
      link: c.Link,
    })),
  })
}
