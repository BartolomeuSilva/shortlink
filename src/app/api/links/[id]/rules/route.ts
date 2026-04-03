import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { nanoid } from 'nanoid'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    // 1. Verificar se o link pertence ao usuário e buscar regras
    const { data: link, error } = await supabaseAdmin
      .from('Link')
      .select(`
        userId,
        rules:RedirectRule(*)
      `)
      .eq('id', params.id)
      .order('order', { foreignTable: 'RedirectRule', ascending: true })
      .single()

    if (error || !link || link.userId !== userId) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 })
    }

    return NextResponse.json({ rules: link.rules || [] })
  } catch (err: any) {
    console.error('❌ Erro ao buscar regras:', err)
    return NextResponse.json({ error: 'Erro ao carregar regras' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    // 1. Verificar se o link pertence ao usuário
    const { data: link } = await supabaseAdmin
      .from('Link')
      .select('userId')
      .eq('id', params.id)
      .single()

    if (!link || link.userId !== userId) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 })
    }

    const body = await req.json()
    const { type, condition, destination, weight = 100, order = 0, active = true } = body

    if (!type || !destination) {
      return NextResponse.json({ error: 'Type and destination are required' }, { status: 400 })
    }

    const { data: rule, error: createError } = await supabaseAdmin
      .from('RedirectRule')
      .insert([
        {
          id: nanoid(),
          linkId: params.id,
          type,
          condition: typeof condition === 'string' ? condition : JSON.stringify(condition),
          destination,
          weight,
          order,
          active,
        }
      ])
      .select()
      .single()

    if (createError) throw createError

    return NextResponse.json({ rule }, { status: 201 })
  } catch (err: any) {
    console.error('❌ Erro ao criar regra:', err)
    return NextResponse.json({ error: 'Erro ao criar regra' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { ruleId, ...data } = body

    // 1. Verificar se o link pertence ao usuário
    const { data: link } = await supabaseAdmin
      .from('Link')
      .select('userId')
      .eq('id', params.id)
      .single()

    if (!link || link.userId !== userId) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 })
    }

    // 2. Verificar se a regra pertence ao link
    const { data: existingRule } = await supabaseAdmin
      .from('RedirectRule')
      .select('linkId')
      .eq('id', ruleId)
      .single()

    if (!existingRule || existingRule.linkId !== params.id) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 })
    }

    const updateData: any = {}
    if (data.type !== undefined) updateData.type = data.type
    if (data.condition !== undefined) updateData.condition = typeof data.condition === 'string' ? data.condition : JSON.stringify(data.condition)
    if (data.destination !== undefined) updateData.destination = data.destination
    if (data.weight !== undefined) updateData.weight = data.weight
    if (data.order !== undefined) updateData.order = data.order
    if (data.active !== undefined) updateData.active = data.active

    const { data: rule, error: updateError } = await supabaseAdmin
      .from('RedirectRule')
      .update(updateData)
      .eq('id', ruleId)
      .select()
      .single()

    if (updateError) throw updateError

    return NextResponse.json({ rule })
  } catch (err: any) {
    console.error('❌ Erro ao atualizar regra:', err)
    return NextResponse.json({ error: 'Erro ao atualizar regra' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const ruleId = searchParams.get('ruleId')

    if (!ruleId) return NextResponse.json({ error: 'ruleId required' }, { status: 400 })

    // 1. Verificar se o link pertence ao usuário
    const { data: link } = await supabaseAdmin
      .from('Link')
      .select('userId')
      .eq('id', params.id)
      .single()

    if (!link || link.userId !== userId) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 })
    }

    const { error: deleteError } = await supabaseAdmin
      .from('RedirectRule')
      .delete()
      .eq('id', ruleId)
      .eq('linkId', params.id)

    if (deleteError) throw deleteError

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('❌ Erro ao excluir regra:', err)
    return NextResponse.json({ error: 'Erro ao excluir regra' }, { status: 500 })
  }
}
