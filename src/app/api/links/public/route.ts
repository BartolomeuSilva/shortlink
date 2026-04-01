import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { redisSet } from '@/lib/redis'
import { generateShortCode, isValidUrl, getBaseUrl } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const { originalUrl } = await request.json()

    if (!originalUrl) {
      return NextResponse.json({ error: 'URL é obrigatória' }, { status: 400 })
    }

    if (!isValidUrl(originalUrl)) {
      return NextResponse.json({ error: 'URL inválida' }, { status: 400 })
    }

    let shortCode = generateShortCode(7)
    let attempts = 0

    while (attempts < 10) {
      const exists = await prisma.link.findUnique({ where: { shortCode } })
      if (!exists) break
      shortCode = generateShortCode(7)
      attempts++
    }

    if (attempts >= 10) {
      return NextResponse.json({ error: 'Erro ao gerar link único' }, { status: 500 })
    }

    const link = await prisma.link.create({
      data: {
        shortCode,
        originalUrl,
        isActive: true,
      },
    })

    await redisSet(`link:${shortCode}`, JSON.stringify({
      id: link.id,
      originalUrl: link.originalUrl,
      passwordRequired: false,
      isActive: true,
    }), 3600)

    return NextResponse.json({
      shortCode: link.shortCode,
      shortUrl: `${getBaseUrl()}/${link.shortCode}`,
    }, { status: 201 })
  } catch (error) {
    console.error('Public link creation error:', error)
    return NextResponse.json({ error: 'Erro ao criar link' }, { status: 500 })
  }
}
