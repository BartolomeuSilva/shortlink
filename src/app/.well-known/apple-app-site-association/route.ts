import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { headers } from 'next/headers'

export async function GET() {
  const host = headers().get('host') || ''
  const baseDomain = process.env.NEXT_PUBLIC_APP_URL?.replace(/https?:\/\//, '') || ''

  // Check if this is a custom domain request
  const isCustomDomain = host !== baseDomain && !host.includes('localhost')

  let appIds: string[] = []

  if (isCustomDomain) {
    const domain = await prisma.domain.findFirst({
      where: { domain: host, verified: true },
      include: { deepLinkConfig: true },
    })
    if (domain?.deepLinkConfig?.iosAppId) {
      appIds = [domain.deepLinkConfig.iosAppId]
    }
  } else {
    // Return all configured iOS app IDs for the main domain
    const configs = await prisma.deepLinkConfig.findMany({
      where: { iosAppId: { not: null } },
      select: { iosAppId: true },
    })
    appIds = configs.map(c => c.iosAppId!).filter(Boolean)
  }

  const json = {
    applinks: {
      apps: [],
      details: appIds.map(appID => ({
        appID,
        paths: ['/*'],
      })),
    },
  }

  return new NextResponse(JSON.stringify(json), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
