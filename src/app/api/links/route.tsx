import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redisSet } from '@/lib/redis'
import { generateShortCode, isValidUrl, getBaseUrl } from '@/lib/utils'
import { z } from 'zod'

const createLinkSchema = z.object({
  url: z.string().min(1, 'URL é obrigatória'),
  customCode: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  password: z.string().optional(),
  expiresAt: z.string().datetime({ local: true }).optional(),
  startsAt: z.string().datetime({ local: true }).optional(),
  maxClicks: z.number().int().positive().optional(),
  tags: z.array(z.string()).optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  utmTerm: z.string().optional(),
  utmContent: z.string().optional(),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  ogImage: z.string().optional(),
  campaignId: z.string().optional(),
})

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const search = searchParams.get('search') || ''
  const tag = searchParams.get('tag') || ''
  const sortBy = searchParams.get('sortBy') || 'createdAt'
  const sortOrder = searchParams.get('sortOrder') || 'desc'

  const skip = (page - 1) * limit

  const where: Record<string, unknown> = { userId: session.user.id }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { originalUrl: { contains: search, mode: 'insensitive' } },
      { shortCode: { contains: search, mode: 'insensitive' } },
    ]
  }

  if (tag) {
    where.tags = {
      some: {
        name: tag,
      },
    }
  }

  const [links, total] = await Promise.all([
    prisma.link.findMany({
      where,
      include: {
        tags: true,
        _count: {
          select: { clicks: true },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    }),
    prisma.link.count({ where }),
  ])

  return NextResponse.json({
    links,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const result = createLinkSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      )
    }

    const {
      url, customCode, title, description, password,
      expiresAt, startsAt, maxClicks,
      utmSource, utmMedium, utmCampaign, utmTerm, utmContent,
      ogTitle, ogDescription, ogImage, campaignId,
    } = result.data

    if (!isValidUrl(url)) {
      return NextResponse.json(
        { error: 'URL inválida' },
        { status: 400 }
      )
    }

    let shortCode = customCode?.trim()

    if (shortCode) {
      if (!/^[a-zA-Z0-9_-]+$/.test(shortCode)) {
        return NextResponse.json(
          { error: 'Código customizado deve conter apenas letras, números, - ou _' },
          { status: 400 }
        )
      }

      if (shortCode.length < 3 || shortCode.length > 50) {
        return NextResponse.json(
          { error: 'Código customizado deve ter entre 3 e 50 caracteres' },
          { status: 400 }
        )
      }

      const existing = await prisma.link.findUnique({
        where: { shortCode },
      })

      if (existing) {
        return NextResponse.json(
          { error: 'Este código já está em uso' },
          { status: 409 }
        )
      }
    } else {
      let attempts = 0
      do {
        shortCode = generateShortCode(7)
        const exists = await prisma.link.findUnique({ where: { shortCode } })
        if (!exists) break
        attempts++
      } while (attempts < 10)

      if (attempts >= 10) {
        return NextResponse.json(
          { error: 'Erro ao gerar código único. Tente novamente.' },
          { status: 500 }
        )
      }
    }

    let hashedPassword: string | null = null
    if (password) {
      const bcrypt = await import('bcryptjs')
      hashedPassword = await bcrypt.hash(password, 12)
    }

    const link = await prisma.link.create({
      data: {
        shortCode,
        originalUrl: url,
        userId: session.user.id,
        title: title || null,
        description: description || null,
        password: hashedPassword,
        passwordRequired: !!password,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        startsAt: startsAt ? new Date(startsAt) : null,
        maxClicks: maxClicks || null,
        utmSource: utmSource || null,
        utmMedium: utmMedium || null,
        utmCampaign: utmCampaign || null,
        utmTerm: utmTerm || null,
        utmContent: utmContent || null,
        ogTitle: ogTitle || null,
        ogDescription: ogDescription || null,
        ogImage: ogImage || null,
        campaignId: campaignId || null,
        isActive: true,
      },
      include: { tags: true },
    })

    await redisSet(`link:${shortCode}`, JSON.stringify({
      id: link.id,
      originalUrl: link.originalUrl,
      passwordRequired: link.passwordRequired,
      password: link.password,
      expiresAt: link.expiresAt?.toISOString() || null,
      isActive: link.isActive,
    }), 3600)

    return NextResponse.json({
      ...link,
      shortUrl: `${getBaseUrl()}/${shortCode}`,
    }, { status: 201 })
  } catch (error) {
    console.error('Create link error:', error)
    return NextResponse.json(
      { error: 'Erro ao criar link' },
      { status: 500 }
    )
  }
}
