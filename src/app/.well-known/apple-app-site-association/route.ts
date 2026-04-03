import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { headers } from 'next/headers'

export async function GET() {
  const host = headers().get('host') || ''
  const baseDomain = process.env.NEXT_PUBLIC_APP_URL?.replace(/https?:\/\//, '') || ''
  const isCustomDomain = host !== baseDomain && !host.includes('localhost')

  let appIds: string[] = []

  if (isCustomDomain) {
    const { data: domain } = await supabaseAdmin
      .from('Domain')
      .select('id, DeepLinkConfig(iosAppId)')
      .eq('domain', host)
      .eq('verified', true)
      .single()
    const appId = (domain as any)?.DeepLinkConfig?.iosAppId
    if (appId) appIds = [appId]
  } else {
    const { data: configs } = await supabaseAdmin
      .from('DeepLinkConfig')
      .select('iosAppId')
      .not('iosAppId', 'is', null)
    appIds = (configs || []).map((c: any) => c.iosAppId).filter(Boolean)
  }

  const json = {
    applinks: {
      apps: [],
      details: appIds.map(appID => ({ appID, paths: ['/*'] })),
    },
  }

  return new NextResponse(JSON.stringify(json), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600' },
  })
}
