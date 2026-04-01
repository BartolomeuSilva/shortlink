import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { redisGet } from '@/lib/redis'
import { getBaseUrl } from '@/lib/utils'
import QRCode from 'qrcode'

export async function GET(
  request: NextRequest,
  { params }: { params: { identifier: string } }
) {
  const { identifier } = params
  const { searchParams } = new URL(request.url)

  const format = searchParams.get('format') || 'svg'
  const size = Math.min(parseInt(searchParams.get('size') || '300'), 1000)

  const link = await prisma.link.findFirst({
    where: {
      OR: [{ id: identifier }, { shortCode: identifier }],
    },
    select: { shortCode: true, customDomain: true },
  })

  if (!link) {
    return NextResponse.json({ error: 'Link não encontrado' }, { status: 404 })
  }

  const shortUrl = link.customDomain
    ? `https://${link.customDomain}/${link.shortCode}`
    : `${getBaseUrl()}/${link.shortCode}`

  try {
    if (format === 'svg') {
      const svg = await QRCode.toString(shortUrl, {
        type: 'svg',
        width: size,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
      })
      return new NextResponse(svg, {
        headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=86400' },
      })
    }

    const buffer = await QRCode.toBuffer(shortUrl, {
      type: 'png',
      width: size,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    })

    return new NextResponse(new Uint8Array(buffer), {
      headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=86400' },
    })
  } catch (error) {
    console.error('QR Code error:', error)
    return NextResponse.json({ error: 'Erro ao gerar QR Code' }, { status: 500 })
  }
}
