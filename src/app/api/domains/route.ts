import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { z } from 'zod'
import { nanoid } from 'nanoid'

const domainSchema = z.object({
  domain: z.string().min(1, 'Domínio é obrigatório').regex(/^[a-zA-Z0-9][a-zA-Z0-9.-]*[a-zA-Z0-9]*\.[a-zA-Z]{2,}$/, 'Domínio inválido'),
})

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: domains, error } = await supabaseAdmin
    .from('Domain')
    .select('*')
    .eq('userId', session.user.id)
    .order('createdAt', { ascending: false })

  if (error) {
    console.error('Fetch domains error:', error)
    return NextResponse.json({ error: 'Erro ao buscar domínios' }, { status: 500 })
  }

  return NextResponse.json({ domains })
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const result = domainSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      )
    }

    const { domain } = result.data

    const { data: existing } = await supabaseAdmin
      .from('Domain')
      .select('id')
      .eq('domain', domain)
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { error: 'Este domínio já está em uso' },
        { status: 409 }
      )
    }

    const txtRecord = `verify-${Date.now()}-${Math.random().toString(36).substring(7)}`
    const now = new Date().toISOString()

    const { data: newDomain, error: createError } = await supabaseAdmin
      .from('Domain')
      .insert({
        id: nanoid(),
        domain,
        userId: session.user.id,
        txtRecord,
        verified: false,
        createdAt: now,
        updatedAt: now,
      })
      .select()
      .single()

    if (createError) {
      throw createError
    }

    return NextResponse.json({
      domain: newDomain,
      message: 'Domínio adicionado. Configure o registro TXT para verificar propriedade.',
    }, { status: 201 })
  } catch (error) {
    console.error('Create domain error:', error)
    return NextResponse.json(
      { error: 'Erro ao criar domínio' },
      { status: 500 }
    )
  }
}
