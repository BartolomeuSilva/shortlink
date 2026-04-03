import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { redisSet } from '@/lib/redis'
import { generateShortCode, isValidUrl, getBaseUrl } from '@/lib/utils'
import { z } from 'zod'
import { nanoid } from 'nanoid'

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
  generateQr: z.boolean().optional(),
  workspaceId: z.string().optional(),
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
  const userId = session?.user?.id

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const search = searchParams.get('search') || ''
  const workspaceId = searchParams.get('workspaceId')
  const sortBy = searchParams.get('sortBy') || 'createdAt'
  const sortOrder = searchParams.get('sortOrder') || 'desc'

  const skip = (page - 1) * limit

  try {
    // Query simplificada SEM tags para evitar erro de relacionamento PGRST200
    let query = supabaseAdmin
      .from('Link')
      .select('*, qrConfig:QRConfig(id)', { count: 'exact' })

    if (workspaceId) {
      // Verificar se o usuário é membro do workspace solicitado
      const { data: member } = await supabaseAdmin
        .from('WorkspaceMember')
        .select('id')
        .eq('workspaceId', workspaceId)
        .eq('userId', userId)
        .single()
      
      if (!member) return NextResponse.json({ error: 'Acesso negado ao workspace' }, { status: 403 })
      query = query.eq('workspaceId', workspaceId)
    } else {
      // Espaço pessoal: links onde o dono é o usuário e não tem workspaceId
      query = query.eq('userId', userId).is('workspaceId', null)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,originalUrl.ilike.%${search}%,shortCode.ilike.%${search}%`)
    }

    const { data: links, count: total, error } = await query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(skip, skip + limit - 1)

    if (error) throw error

    // Formatar para manter compatibilidade com o frontend
    const formattedLinks = (links || []).map(link => ({
      ...link,
      tags: [],
      hasQr: !!link.qrConfig && (Array.isArray(link.qrConfig) ? link.qrConfig.length > 0 : true),
      _count: {
        clicks: link.clickCount || 0
      }
    }))

    return NextResponse.json({
      links: formattedLinks,
      pagination: {
        page,
        limit,
        total: total || 0,
        totalPages: Math.ceil((total || 0) / limit),
      },
    })
  } catch (error: any) {
    console.error('❌ Erro Crítico ao buscar links:', error)
    return NextResponse.json({ error: 'Erro ao buscar links no banco' }, { status: 500 })
  }
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
      expiresAt, startsAt, maxClicks, generateQr, workspaceId,
      utmSource, utmMedium, utmCampaign, utmTerm, utmContent,
      ogTitle, ogDescription, ogImage, campaignId,
    } = result.data

    if (!isValidUrl(url)) {
      return NextResponse.json({ error: 'URL inválida' }, { status: 400 })
    }

    let shortCode = customCode?.trim()

    if (shortCode) {
      const { data: existing } = await supabaseAdmin
        .from('Link')
        .select('id')
        .eq('shortCode', shortCode)
        .maybeSingle()

      if (existing) {
        return NextResponse.json({ error: 'Este código já está em uso' }, { status: 409 })
      }
    } else {
      shortCode = generateShortCode(7)
    }

    let hashedPassword: string | null = null
    if (password) {
      const bcrypt = await import('bcryptjs')
      hashedPassword = await bcrypt.hash(password, 12)
    }

    const now = new Date().toISOString()
    const { data: link, error: createError } = await supabaseAdmin
      .from('Link')
      .insert({
        id: nanoid(),
        shortCode,
        originalUrl: url,
        userId: session.user.id,
        workspaceId: workspaceId || null,
        title: title || null,
        description: description || null,
        password: hashedPassword,
        passwordRequired: !!password,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        startsAt: startsAt ? new Date(startsAt).toISOString() : null,
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
        createdAt: now,
        updatedAt: now,
      })
      .select()
      .single()

    if (createError) throw createError

    if (generateQr) {
      await supabaseAdmin
        .from('QRConfig')
        .insert({
          id: nanoid(),
          linkId: link.id,
          fgColor: '#000000',
          bgColor: '#FFFFFF',
          cornerStyle: 'square',
          errorLevel: 'M'
        })
    }

    // Cache no Redis
    try {
      await redisSet(`link:${shortCode}`, JSON.stringify({
        id: link.id,
        originalUrl: link.originalUrl,
        passwordRequired: link.passwordRequired,
        isActive: link.isActive,
      }), 3600)
    } catch {}

    return NextResponse.json({
      ...link,
      tags: [],
      shortUrl: `${getBaseUrl()}/${shortCode}`,
    }, { status: 201 })
  } catch (error) {
    console.error('❌ Create link error:', error)
    return NextResponse.json({ error: 'Erro ao criar link' }, { status: 500 })
  }
}
