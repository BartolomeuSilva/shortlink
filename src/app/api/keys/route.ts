import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { customAlphabet } from 'nanoid'
import { z } from 'zod'

const generateApiKey = customAlphabet(
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  32
)

const createApiKeySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100),
  expiresAt: z.string().datetime().optional(),
})

export async function GET(request: NextRequest) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apiKeys = await prisma.apiKey.findMany({
    where: {
      userId: session.user.id,
      revokedAt: null,
    },
    select: {
      id: true,
      name: true,
      lastUsedAt: true,
      expiresAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ keys: apiKeys.map(k => ({ id: k.id, name: k.name, lastUsedAt: k.lastUsedAt, expiresAt: k.expiresAt, createdAt: k.createdAt, revokedAt: null })) })
}

export async function POST(request: NextRequest) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const result = createApiKeySchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      )
    }

    const { name, expiresAt } = result.data

    const key = generateApiKey()
    const bcrypt = await import('bcryptjs')
    const keyHash = await bcrypt.hash(key, 10)

    const apiKey = await prisma.apiKey.create({
      data: {
        userId: session.user.id,
        name,
        keyHash,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    })

    return NextResponse.json({
      key: key,
      apiKey: {
        id: apiKey.id,
        name: apiKey.name,
        expiresAt: apiKey.expiresAt,
        createdAt: apiKey.createdAt,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('API key creation error:', error)
    return NextResponse.json({ error: 'Erro ao criar API key' }, { status: 500 })
  }
}
