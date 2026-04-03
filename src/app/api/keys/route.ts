import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { customAlphabet, nanoid } from 'nanoid'
import { z } from 'zod'

const generateApiKeyString = customAlphabet(
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

  try {
    const { data: apiKeys, error } = await supabaseAdmin
      .from('ApiKey')
      .select('id, name, lastUsedAt, expiresAt, createdAt')
      .eq('userId', session.user.id)
      .is('revokedAt', null)
      .order('createdAt', { ascending: false })

    if (error) throw error

    return NextResponse.json({ keys: apiKeys || [] })
  } catch (err: any) {
    console.error('❌ Erro ao buscar API keys:', err)
    return NextResponse.json({ error: 'Erro ao carregar API keys' }, { status: 500 })
  }
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

    const key = generateApiKeyString()
    const bcrypt = await import('bcryptjs')
    const keyHash = await bcrypt.hash(key, 10)

    const now = new Date().toISOString()
    const { data: apiKey, error: createError } = await supabaseAdmin
      .from('ApiKey')
      .insert([
        {
          id: nanoid(),
          userId: session.user.id,
          name,
          keyHash,
          expiresAt: expiresAt || null,
          createdAt: now
        }
      ])
      .select()
      .single()

    if (createError) throw createError

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
    console.error('❌ Erro ao criar API key:', error)
    return NextResponse.json({ error: 'Erro ao criar API key' }, { status: 500 })
  }
}
