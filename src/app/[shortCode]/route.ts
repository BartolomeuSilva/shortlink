import { NextResponse } from 'next/server'
import { redisGet, redisSet } from '@/lib/redis'
import { supabaseAdmin } from '@/lib/supabase'
import { headers } from 'next/headers'
import { hashIp } from '@/lib/utils'
import { nanoid } from 'nanoid'

let geoip: { lookup: (ip: string) => { country?: string; city?: string } | null } | null = null

function getGeoIp() {
  if (geoip === null) {
    try { geoip = require('geoip-lite') } catch { geoip = null }
  }
  return geoip
}

let UAParser: { default: new (ua: string) => { getResult: () => { device: { type?: string }; os: { name?: string; version?: string }; browser: { name?: string } } } } | null = null

function getUAParser() {
  if (UAParser === null) {
    try { UAParser = require('ua-parser-js') } catch { UAParser = null }
  }
  return UAParser
}

interface RedirectRule {
  id: string
  type: string
  condition: string
  destination: string
  weight: number
  order: number
  active: boolean
}

function evaluateRules(
  rules: RedirectRule[],
  country: string | null,
  deviceType: string,
  hour: number
): string | null {
  const activeRules = rules.filter(r => r.active).sort((a, b) => a.order - b.order)

  const abRules = activeRules.filter(r => r.type === 'ab')
  const otherRules = activeRules.filter(r => r.type !== 'ab')

  for (const rule of otherRules) {
    let condition: Record<string, unknown>
    try { condition = JSON.parse(rule.condition) } catch { continue }

    if (rule.type === 'geo') {
      const countries = (condition.countries as string[]) || []
      if (country && countries.map(c => c.toUpperCase()).includes(country.toUpperCase())) {
        return rule.destination
      }
    } else if (rule.type === 'device') {
      const devices = (condition.devices as string[]) || []
      if (devices.map(d => d.toUpperCase()).includes(deviceType.toUpperCase())) {
        return rule.destination
      }
    } else if (rule.type === 'time') {
      const startHour = parseInt((condition.startHour as string) || '0')
      const endHour = parseInt((condition.endHour as string) || '23')
      if (hour >= startHour && hour <= endHour) {
        return rule.destination
      }
    }
  }

  if (abRules.length > 0) {
    const totalWeight = abRules.reduce((s, r) => s + r.weight, 0)
    let rand = Math.random() * totalWeight
    for (const rule of abRules) {
      rand -= rule.weight
      if (rand <= 0) return rule.destination
    }
    return abRules[abRules.length - 1].destination
  }

  return null
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
    // Buscar link no Supabase com relações
    const { data: linkResult } = await supabaseAdmin
      .from('Link')
      .select(`
        *,
        redirectRules:RedirectRule(*),
        user:User(metaPixelId, googleTagId, tiktokPixelId, linkedinTagId)
      `)
      .eq('shortCode', shortCode)
      .eq('RedirectRule.active', true)
      .single()

    link = linkResult

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

  if (link.startsAt && new Date(link.startsAt) > new Date()) {
    return NextResponse.json({ error: 'Link not yet active' }, { status: 410 })
  }

  if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
    return NextResponse.json({ error: 'Link has expired' }, { status: 410 })
  }

  if (link.maxClicks && link.clickCount >= link.maxClicks) {
    return NextResponse.json({ error: 'Link click limit reached' }, { status: 410 })
  }

  if (link.passwordRequired) {
    return NextResponse.redirect(new URL(`/${shortCode}/auth`, request.url))
  }

  const headersList = headers()
  const userAgent = headersList.get('user-agent') || ''
  const forwarded = headersList.get('x-forwarded-for') || ''
  const ip = forwarded.split(',')[0].trim() || 'unknown'

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
  } catch {}

  let geo: { country?: string; city?: string } | null = null
  if (ip && ip !== 'unknown') {
    try {
      const geoModule = getGeoIp()
      if (geoModule) geo = geoModule.lookup(ip)
    } catch {}
  }

  const country = geo?.country || null

  let finalUrl = link.originalUrl
  const rules: RedirectRule[] = link.redirectRules || []
  if (rules.length > 0) {
    const hour = new Date().getHours()
    const matched = evaluateRules(rules, country, deviceType, hour)
    if (matched) finalUrl = matched
  }

  const hasOG = link.ogTitle || link.ogDescription || link.ogImage
  if (hasOG) {
    const html = buildOGPage(link, finalUrl)
    await recordClick(link.id, ip, userAgent, geo, deviceType, os, browser, headersList.get('referer') || '')
    return new Response(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  await recordClick(link.id, ip, userAgent, geo, deviceType, os, browser, headersList.get('referer') || '')

  const pixels = link.user
  const hasPixels = pixels && (pixels.metaPixelId || pixels.googleTagId || pixels.tiktokPixelId || pixels.linkedinTagId)

  if (hasPixels) {
    const html = buildPixelPage(pixels, finalUrl)
    return new Response(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  return NextResponse.redirect(finalUrl, { status: 302 })
}

function buildOGPage(link: { ogTitle?: string | null; ogDescription?: string | null; ogImage?: string | null }, destination: string): string {
  const title = link.ogTitle || '123bit'
  const description = link.ogDescription || ''
  const image = link.ogImage || ''
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title>
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
${image ? `<meta property="og:image" content="${escapeHtml(image)}">` : ''}
<meta http-equiv="refresh" content="0;url=${escapeHtml(destination)}">
<script>window.location.href=${JSON.stringify(destination)}</script>
</head>
<body></body>
</html>`
}

function buildPixelPage(pixels: { metaPixelId?: string | null; googleTagId?: string | null; tiktokPixelId?: string | null; linkedinTagId?: string | null } | null, destination: string): string {
  let scripts = ''
  if (pixels?.metaPixelId) {
    scripts += `<script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${escapeHtml(pixels.metaPixelId)}');fbq('track','PageView');</script>\n`
  }
  if (pixels?.googleTagId) {
    scripts += `<script async src="https://www.googletagmanager.com/gtag/js?id=${escapeHtml(pixels.googleTagId)}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${escapeHtml(pixels.googleTagId)}');</script>\n`
  }
  if (pixels?.tiktokPixelId) {
    scripts += `<script>!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=i;ttq._t=ttq._t||{};ttq._t[e]=+new Date;ttq._o=ttq._o||{};ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript";o.async=!0;o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};ttq.load('${escapeHtml(pixels.tiktokPixelId)}');ttq.page();}(window,document,'ttq');</script>\n`
  }
  if (pixels?.linkedinTagId) {
    scripts += `<script type="text/javascript">_linkedin_partner_id="${escapeHtml(pixels.linkedinTagId)}";window._linkedin_data_partner_ids=window._linkedin_data_partner_ids||[];window._linkedin_data_partner_ids.push(_linkedin_partner_id);</script><script type="text/javascript">(function(l){if(!l){window.lintrk=function(a,b){window.lintrk.q.push([a,b])};window.lintrk.q=[]}var s=document.getElementsByTagName("script")[0];var b=document.createElement("script");b.type="text/javascript";b.async=true;b.src="https://snap.licdn.com/li.lms-analytics/insight.min.js";s.parentNode.insertBefore(b,s)})(window.lintrk);</script>\n`
  }
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
${scripts}
<script>setTimeout(function(){window.location.href=${JSON.stringify(destination)}},100)</script>
</head>
<body></body>
</html>`
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

async function recordClick(
  linkId: string,
  ip: string,
  userAgent: string,
  geo: { country?: string; city?: string } | null,
  deviceType: 'MOBILE' | 'TABLET' | 'DESKTOP' | 'UNKNOWN',
  os: string | null,
  browser: string | null,
  referer: string
) {
  console.log('🖱️ Tentando registrar clique para o link:', linkId)
  try {
    // 1. Registrar clique no Supabase
    const { error: clickError } = await supabaseAdmin
      .from('Click')
      .insert([
        {
          id: nanoid(),
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
          timestamp: new Date().toISOString()
        }
      ])

    if (clickError) {
      console.error('❌ Erro ao inserir clique no Supabase:', clickError)
      return
    }

    // 2. Incrementar contador de cliques no Link
    const { data: link, error: fetchError } = await supabaseAdmin
      .from('Link')
      .select('clickCount')
      .eq('id', linkId)
      .single()
    
    if (fetchError) {
      console.error('❌ Erro ao buscar contador atual:', fetchError)
      return
    }

    const { error: updateError } = await supabaseAdmin
      .from('Link')
      .update({ 
        clickCount: (link.clickCount || 0) + 1,
        updatedAt: new Date().toISOString()
      })
      .eq('id', linkId)

    if (updateError) {
      console.error('❌ Erro ao atualizar contador de cliques:', updateError)
    } else {
      console.log('✅ Clique registrado com sucesso!')
    }

    fireWebhooks(linkId, { deviceType, country: geo?.country || null }).catch(() => {})
  } catch (error) {
    console.error('❌ Erro inesperado ao registrar clique:', error)
  }
}

async function fireWebhooks(linkId: string, meta: { deviceType: string; country: string | null }) {
  try {
    const { data: link } = await supabaseAdmin
      .from('Link')
      .select('userId, shortCode')
      .eq('id', linkId)
      .single()

    if (!link?.userId) return

    const { data: webhooks } = await supabaseAdmin
      .from('Webhook')
      .select('*')
      .eq('userId', link.userId)
      .eq('active', true)
      .contains('events', ['link.clicked'])

    if (!webhooks) return

    const payload = JSON.stringify({
      event: 'link.clicked',
      shortCode: link.shortCode,
      linkId,
      ...meta,
      timestamp: new Date().toISOString(),
    })

    for (const wh of webhooks) {
      try {
        const res = await fetch(wh.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(wh.secret ? { 'X-Webhook-Secret': wh.secret } : {}),
          },
          body: payload,
          signal: AbortSignal.timeout(5000),
        })
        
        await supabaseAdmin
          .from('WebhookDelivery')
          .insert([
            {
              webhookId: wh.id,
              event: 'link.clicked',
              payload,
              statusCode: res.status,
              success: res.ok,
            }
          ])
      } catch {
        await supabaseAdmin
          .from('WebhookDelivery')
          .insert([
            {
              webhookId: wh.id,
              event: 'link.clicked',
              payload,
              success: false,
            }
          ])
      }
    }
  } catch {}
}

function getDeviceType(type?: string, ua?: { os?: { name?: string }, device?: { type?: string } }): 'MOBILE' | 'TABLET' | 'DESKTOP' | 'UNKNOWN' {
  if (type) {
    switch (type.toLowerCase()) {
      case 'mobile': return 'MOBILE'
      case 'tablet': return 'TABLET'
      case 'desktop': return 'DESKTOP'
    }
  }
  const uaStr = JSON.stringify(ua || {}).toLowerCase()
  if (uaStr.includes('mobile') || uaStr.includes('android') || uaStr.includes('iphone')) return 'MOBILE'
  if (uaStr.includes('tablet') || uaStr.includes('ipad')) return 'TABLET'
  return 'DESKTOP'
}
