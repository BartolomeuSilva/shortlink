import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { headers } from 'next/headers'

export async function GET() {
  const host = headers().get('host') || ''
  const baseDomain = process.env.NEXT_PUBLIC_APP_URL?.replace(/https?:\/\//, '') || ''
  const isCustomDomain = host !== baseDomain && !host.includes('localhost')

  let packages: string[] = []

  if (isCustomDomain) {
    const domain = await prisma.domain.findFirst({
      where: { domain: host, verified: true },
      include: { deepLinkConfig: true },
    })
    if (domain?.deepLinkConfig?.androidPackage) {
      packages = [domain.deepLinkConfig.androidPackage]
    }
  } else {
    const configs = await prisma.deepLinkConfig.findMany({
      where: { androidPackage: { not: null } },
      select: { androidPackage: true },
    })
    packages = configs.map(c => c.androidPackage!).filter(Boolean)
  }

  const json = packages.map(pkg => ({
    relation: ['delegate_permission/common.handle_all_urls'],
    target: {
      namespace: 'android_app',
      package_name: pkg,
      sha256_cert_fingerprints: [],
    },
  }))

  return new NextResponse(JSON.stringify(json), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
