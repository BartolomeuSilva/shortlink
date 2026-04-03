import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getBaseUrl } from '@/lib/utils'
import QRCode from 'qrcode'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params
  const { searchParams } = new URL(request.url)

  const format = searchParams.get('format') || 'svg'
  const size = Math.min(parseInt(searchParams.get('size') || '300'), 1000)

  // Buscar link no Supabase buscando por ID ou shortCode
  const { data: link, error } = await supabaseAdmin
    .from('Link')
    .select(`
      shortCode,
      customDomain,
      qrConfig:QRConfig(*)
    `)
    .or(`id.eq.${id},shortCode.eq.${id}`)
    .single()

  if (error || !link) {
    return NextResponse.json({ error: 'Link não encontrado' }, { status: 404 })
  }

  const shortUrl = link.customDomain
    ? `https://${link.customDomain}/${link.shortCode}`
    : `${getBaseUrl()}/${link.shortCode}`

  // Tratar qrConfig que pode vir como array ou objeto único dependendo da relação
  const qrConfig = Array.isArray(link.qrConfig) ? link.qrConfig[0] : link.qrConfig
  
  const fg = qrConfig?.fgColor || '#000000'
  const bg = qrConfig?.bgColor || '#FFFFFF'
  const errLevel = (qrConfig?.errorLevel || 'M') as 'L' | 'M' | 'Q' | 'H'

  try {
    if (format === 'svg') {
      const svg = await QRCode.toString(shortUrl, {
        type: 'svg',
        width: size,
        margin: 2,
        errorCorrectionLevel: errLevel,
        color: { dark: fg, light: bg },
      })
      return new NextResponse(svg, {
        headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=3600' },
      })
    }

    const buffer = await QRCode.toBuffer(shortUrl, {
      type: 'png',
      width: size,
      margin: 2,
      errorCorrectionLevel: errLevel,
      color: { dark: fg, light: bg },
    })

    return new NextResponse(new Uint8Array(buffer), {
      headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=3600' },
    })
  } catch (error) {
    console.error('❌ Erro ao gerar QR Code:', error)
    return NextResponse.json({ error: 'Erro ao gerar QR Code' }, { status: 500 })
  }
}
