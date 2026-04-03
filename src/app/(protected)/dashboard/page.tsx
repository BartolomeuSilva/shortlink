import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { DashboardClient } from './DashboardClient'
import { subDays, startOfDay, format } from 'date-fns'

async function getDashboardData(userId: string, workspaceId?: string) {
  const now = new Date()
  const thirtyDaysAgo = startOfDay(subDays(now, 29)).toISOString()
  const prevThirtyStart = startOfDay(subDays(now, 59)).toISOString()
  const sevenDaysAgo = startOfDay(subDays(now, 6)).toISOString()

  // 1. Total de Links e Cliques Totais (Lifetime) filtrados por Workspace
  let linksBaseQuery = supabaseAdmin.from('Link').select('id, clickCount, isActive, createdAt, shortCode, originalUrl, title')
  
  if (workspaceId) {
    linksBaseQuery = linksBaseQuery.eq('workspaceId', workspaceId)
  } else {
    linksBaseQuery = linksBaseQuery.eq('userId', userId).is('workspaceId', null)
  }

  const { data: linksStats } = await linksBaseQuery

  const totalLinks = linksStats?.length || 0
  const totalClicksLifetime = linksStats?.reduce((acc, curr) => acc + (curr.clickCount || 0), 0) || 0
  const activeLinks = linksStats?.filter(l => l.isActive).length || 0

  // 2. Cliques nos últimos 30 dias
  let clicksQuery = supabaseAdmin
    .from('Click')
    .select('id, timestamp, country, countryCode, deviceType, Link!inner(userId, workspaceId)')
    .gte('timestamp', thirtyDaysAgo)

  if (workspaceId) {
    clicksQuery = clicksQuery.eq('Link.workspaceId', workspaceId)
  } else {
    clicksQuery = clicksQuery.eq('Link.userId', userId).is('Link.workspaceId', null)
  }

  const { data: clicks30 } = await clicksQuery
  const totalClicks30d = clicks30?.length || 0

  // 3. Cliques no período anterior (para o Delta)
  let prevClicksQuery = supabaseAdmin
    .from('Click')
    .select('id, Link!inner(userId, workspaceId)', { count: 'exact', head: true })
    .gte('timestamp', prevThirtyStart)
    .lt('timestamp', thirtyDaysAgo)

  if (workspaceId) {
    prevClicksQuery = prevClicksQuery.eq('Link.workspaceId', workspaceId)
  } else {
    prevClicksQuery = prevClicksQuery.eq('Link.userId', userId).is('Link.workspaceId', null)
  }

  const { count: prevPeriodClicks } = await prevClicksQuery

  // 4. Links Recentes (usando os dados já buscados em linksStats)
  const recentLinks = [...(linksStats || [])]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  // 5. Cliques Semanais
  const weeklyClicks = clicks30?.filter(c => new Date(c.timestamp) >= new Date(sevenDaysAgo)).length || 0

  // 6. Processar dados para o gráfico
  const chartData: { date: string; clicks: number }[] = []
  const clickMap = new Map<string, number>()
  
  clicks30?.forEach(c => {
    const day = format(new Date(c.timestamp), 'yyyy-MM-dd')
    clickMap.set(day, (clickMap.get(day) || 0) + 1)
  })

  for (let i = 29; i >= 0; i--) {
    const d = startOfDay(subDays(now, i))
    const key = format(d, 'yyyy-MM-dd')
    chartData.push({ date: key, clicks: clickMap.get(key) || 0 })
  }

  // 7. Processar Geo Data
  const geoMap = new Map<string, { country: string, countryCode: string, clicks: number }>()
  clicks30?.forEach(c => {
    if (c.country) {
      const existing = geoMap.get(c.country)
      if (existing) {
        existing.clicks++
      } else {
        geoMap.set(c.country, { country: c.country, countryCode: c.countryCode || '', clicks: 1 })
      }
    }
  })
  const geoData = Array.from(geoMap.values())
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 5)

  // 8. Processar Device Data
  const deviceMap = new Map<string, number>()
  clicks30?.forEach(c => {
    const type = c.deviceType || 'UNKNOWN'
    deviceMap.set(type, (deviceMap.get(type) || 0) + 1)
  })
  const deviceData = Array.from(deviceMap.entries()).map(([deviceType, clicks]) => ({
    deviceType,
    clicks
  }))

  const delta = (prevPeriodClicks || 0) > 0
    ? Math.round(((totalClicks30d - (prevPeriodClicks || 0)) / (prevPeriodClicks || 0)) * 100)
    : totalClicks30d > 0 ? 100 : 0

  return {
    metrics: {
      totalClicks: totalClicksLifetime,
      delta,
      activeLinks,
      totalLinks,
      weeklyClicks,
    },
    chartData,
    recentLinks: recentLinks.map((l: any) => ({
      id: l.id,
      shortCode: l.shortCode,
      originalUrl: l.originalUrl,
      title: l.title,
      clickCount: l.clickCount || 0,
      isActive: l.isActive,
      createdAt: l.createdAt,
    })),
    geoData,
    deviceData,
  }
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ workspaceId?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) return null

  const params = await searchParams
  const data = await getDashboardData(session.user.id, params.workspaceId)

  return (
    <DashboardClient
      metrics={data.metrics}
      chartData={data.chartData}
      recentLinks={data.recentLinks}
      geoData={data.geoData}
      deviceData={data.deviceData}
      userName={session.user.name || session.user.email?.split('@')[0] || 'Usuário'}
    />
  )
}
