import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { subDays, startOfDay, endOfDay } from 'date-fns'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const period = parseInt(searchParams.get('period') || '30')
  const { id: linkId } = params

  try {
    // 1. Verificar se o link pertence ao usuário e pegar o total real
    const { data: link, error: linkError } = await supabaseAdmin
      .from('Link')
      .select('id, clickCount')
      .eq('id', linkId)
      .eq('userId', userId)
      .single()

    if (linkError || !link) {
      return NextResponse.json({ error: 'Link não encontrado' }, { status: 404 })
    }

    const realTotalClicks = link.clickCount || 0

    const startDate = startOfDay(subDays(new Date(), period)).toISOString()
    const endDate = endOfDay(new Date()).toISOString()

    // 2. Buscar todos os cliques do período
    const { data: clicks, error: clicksError } = await supabaseAdmin
      .from('Click')
      .select('*')
      .eq('linkId', linkId)
      .gte('timestamp', startDate)
      .lte('timestamp', endDate)
      .order('timestamp', { ascending: false })

    if (clicksError) throw clicksError

    const clicksArray = (clicks || []) as any[]
    const totalCount = clicksArray.length

    // Processamento de dados em memória
    const clicksByDay: Record<string, number> = {}
    const clicksByHour: Record<number, number> = {}
    for (let i = 0; i < 24; i++) clicksByHour[i] = 0
    
    const clicksByCountry: Record<string, number> = {}
    const clicksByDevice: Record<string, number> = {}
    const clicksByBrowser: Record<string, number> = {}
    const clicksByOS: Record<string, number> = {}
    const uniqueIps = new Set<string>()
    const botClicks: string[] = []

    const botPatterns = [
      /bot/i, /spider/i, /crawler/i, /curl/i, /wget/i,
      /python-requests/i, /httpclient/i, /axios/i,
      /headless/i, /puppeteer/i, /selenium/i,
    ]

    for (const click of clicksArray) {
      const ts = new Date(click.timestamp)
      const day = ts.toISOString().split('T')[0]
      const hour = ts.getHours()

      clicksByDay[day] = (clicksByDay[day] || 0) + 1
      clicksByHour[hour] = (clicksByHour[hour] || 0) + 1

      if (click.ipHash) uniqueIps.add(click.ipHash)

      if (click.country) {
        clicksByCountry[click.country] = (clicksByCountry[click.country] || 0) + 1
      }
      if (click.deviceType) {
        clicksByDevice[click.deviceType] = (clicksByDevice[click.deviceType] || 0) + 1
      }
      if (click.browser) {
        clicksByBrowser[click.browser] = (clicksByBrowser[click.browser] || 0) + 1
      }
      if (click.os) {
        clicksByOS[click.os] = (clicksByOS[click.os] || 0) + 1
      }

      const ua = click.userAgent || ''
      if (botPatterns.some(pattern => pattern.test(ua))) {
        botClicks.push(click.id)
      }
    }

    const topReferersMap = clicksArray
      .filter(c => c.referer)
      .reduce((acc, c) => {
        try {
          const ref = new URL(c.referer || '').hostname
          if (ref) acc[ref] = (acc[ref] || 0) + 1
        } catch { /* ignorar referers mal formados */ }
        return acc
      }, {} as Record<string, number>)

    const chartData = Object.entries(clicksByDay)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, clicks: count as number }))

    const hourlyData = Object.entries(clicksByHour).map(([hour, count]) => ({ hour: parseInt(hour), clicks: count as number }))

    const sortedReferers = (Object.entries(topReferersMap) as [string, number][])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([referer, clicks]) => ({ referer, clicks }))

    return NextResponse.json({
      summary: {
        totalClicks: realTotalClicks,
        uniqueVisitors: uniqueIps.size,
        botClicks: botClicks.length,
        bounceRate: totalCount > 0 ? Math.round((botClicks.length / totalCount) * 100) : 0,
      },
      chartData,
      hourlyData,
      clicksByCountry: (Object.entries(clicksByCountry) as [string, number][])
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([country, clicks]) => ({ country, clicks })),
      clicksByDevice: (Object.entries(clicksByDevice) as [string, number][])
        .sort((a, b) => b[1] - a[1])
        .map(([device, clicks]) => ({ device, clicks })),
      clicksByBrowser: (Object.entries(clicksByBrowser) as [string, number][])
        .sort((a, b) => b[1] - a[1])
        .map(([browser, clicks]) => ({ browser, clicks })),
      clicksByOS: (Object.entries(clicksByOS) as [string, number][])
        .sort((a, b) => b[1] - a[1])
        .map(([os, clicks]) => ({ os, clicks })),
      topReferers: sortedReferers,
    })
  } catch (error: any) {
    console.error('❌ Analytics error:', error)
    return NextResponse.json({ error: 'Erro ao carregar analytics' }, { status: 500 })
  }
}
