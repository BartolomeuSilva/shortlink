import { NextResponse } from 'next/server'
import { redisGet, redisSet } from '@/lib/redis'
import { prisma } from '@/lib/db'
import { headers } from 'next/headers'
import { hashIp } from '@/lib/utils'

let geoip: { lookup: (ip: string) => { country?: string; city?: string } | null } | null = null

function getGeoIp() {
  if (geoip === null) {
    try {
      geoip = require('geoip-lite')
    } catch {
      geoip = null
    }
  }
  return geoip
}

let UAParser: { default: new (ua: string) => { getResult: () => { device: { type?: string }; os: { name?: string; version?: string }; browser: { name?: string } } } } | null = null

function getUAParser() {
  if (UAParser === null) {
    try {
      UAParser = require('ua-parser-js')
    } catch {
      UAParser = null
    }
  }
  return UAParser
}

export async function GET(
  request: Request,
  { params }: { params: { shortCode: string } }
) {
  const { shortCode } = params
  const cacheKey = `link:${shortCode}`
  const linkData = await redisGet(cacheKey)

  let link

  if (linkData) {
    link = JSON.parse(linkData)
  } else {
    link = await prisma.link.findUnique({
      where: { shortCode },
      select: {
        id: true,
        originalUrl: true,
        passwordRequired: true,
        password: true,
        expiresAt: true,
        isActive: true,
      },
    })

    if (link) {
      await redisSet(cacheKey, JSON.stringify(link), 3600)
    }
  }

  if (!link) {
    return NextResponse.json({ error: 'Link not found' }, { status: 404 })
  }

  if (!link.isActive) {
    return NextResponse.json({ error: 'Link is disabled' }, { status: 410 })
  }

  if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
    return NextResponse.json({ error: 'Link has expired' }, { status: 410 })
  }

  if (link.passwordRequired) {
    return NextResponse.redirect(new URL(`/${shortCode}/auth`, request.url))
  }

  await recordClick(link.id, request)

  return NextResponse.redirect(link.originalUrl, { status: 302 })
}

async function recordClick(linkId: string, request: Request) {
  try {
    const headersList = await headers()
    const userAgent = headersList.get('user-agent') || ''
    const forwarded = headersList.get('x-forwarded-for') || ''
    const ip = forwarded.split(',')[0].trim() || 'unknown'
    const referer = headersList.get('referer') || ''

    let deviceType: 'MOBILE' | 'TABLET' | 'DESKTOP' | 'UNKNOWN' = 'UNKNOWN'
    let os: string | null = null
    let browser: string | null = null

    try {
      const uaModule = getUAParser()
      if (uaModule) {
        const UAParser = uaModule.default || uaModule
        const parser = new UAParser(userAgent)
        const ua = parser.getResult()
        deviceType = getDeviceType(ua.device.type, ua)
        os = ua.os.name ? `${ua.os.name} ${ua.os.version || ''}`.trim() : null
        browser = ua.browser.name || null
      }
    } catch (e) {
      console.error('UA parsing error:', e)
    }

    let geo = null
    if (ip && ip !== 'unknown') {
      try {
        const geoModule = getGeoIp()
        if (geoModule) {
          geo = geoModule.lookup(ip)
        }
      } catch {}
    }

    const clickData = {
      linkId,
      ipHash: hashIp(ip),
      country: geo?.country || null,
      city: geo?.city || null,
      countryCode: geo?.country || null,
      deviceType,
      os,
      browser,
      referer: referer.substring(0, 500),
      userAgent: userAgent.substring(0, 500),
    }

    await prisma.click.create({ data: clickData })

    await prisma.link.update({
      where: { id: linkId },
      data: { clickCount: { increment: 1 } },
    })

    const cacheKey = `link:${await getShortCode(linkId)}`
    const cached = await redisGet(cacheKey)
    if (cached) {
      const data = JSON.parse(cached)
      data.clickCount = (data.clickCount || 0) + 1
      await redisSet(cacheKey, JSON.stringify(data), 3600)
    }
  } catch (error) {
    console.error('Error recording click:', error)
  }
}

async function getShortCode(linkId: string): Promise<string> {
  const link = await prisma.link.findUnique({
    where: { id: linkId },
    select: { shortCode: true },
  })
  return link?.shortCode || ''
}

function getDeviceType(type?: string, ua?: { os?: { name?: string }, device?: { type?: string, model?: string } }): 'MOBILE' | 'TABLET' | 'DESKTOP' | 'UNKNOWN' {
  if (type) {
    switch (type.toLowerCase()) {
      case 'mobile':
        return 'MOBILE'
      case 'tablet':
        return 'TABLET'
      case 'desktop':
        return 'DESKTOP'
    }
  }
  
  const uaStr = JSON.stringify(ua || {}).toLowerCase()
  if (uaStr.includes('mobile') || uaStr.includes('android') || uaStr.includes('iphone') || uaStr.includes('ipad')) {
    return 'MOBILE'
  }
  if (uaStr.includes('tablet') || uaStr.includes('ipad')) {
    return 'TABLET'
  }
  
  return 'DESKTOP'
}
