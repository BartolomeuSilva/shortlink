import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { headers } from 'next/headers'

export async function GET() {
  const host = headers().get('host') || ''
  const baseDomain = process.env.NEXT_PUBLIC_APP_URL?.replace(/https?:\/\//, '') || ''
  const isCustomDomain = host !== baseDomain && !host.includes('localhost')

  let packages: string[] = []

  if (isCustomDomain) {
    const { data: domain } = await supabaseAdmin
      .from('Domain')
      .select('id, DeepLinkConfig(androidPackage)')
      .eq('domain', host)
      .eq('verified', true)
      .single()
    const pkg = (domain as any)?.DeepLinkConfig?.androidPackage
    if (pkg) packages = [pkg]
  } else {
    const { data: configs } = await supabaseAdmin
      .from('DeepLinkConfig')
      .select('androidPackage')
      .not('androidPackage', 'is', null)
    packages = (configs || []).map((c: any) => c.androidPackage).filter(Boolean)
  }

  const json = packages.map(pkg => ({
    relation: ['delegate_permission/common.handle_all_urls'],
    target: { namespace: 'android_app', package_name: pkg, sha256_cert_fingerprints: [] },
  }))

  return new NextResponse(JSON.stringify(json), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600' },
  })
}
