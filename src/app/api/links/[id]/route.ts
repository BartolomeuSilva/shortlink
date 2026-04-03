import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { redisSet } from '@/lib/redis'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    // 1. Verificar se o link pertence ao usuário
    const { data: link, error: fetchError } = await supabaseAdmin
      .from('Link')
      .select('*')
      .eq('id', params.id)
      .single()

    if (fetchError || !link || link.userId !== userId) {
      return NextResponse.json({ error: 'Link não encontrado' }, { status: 404 })
    }

    // 2. Atualizar o link
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('Link')
      .update({
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.title !== undefined && { title: body.title }),
        ...(body.originalUrl !== undefined && { originalUrl: body.originalUrl }),
        ...(body.campaignId !== undefined && { campaignId: body.campaignId || null }),
        updatedAt: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single()

    if (updateError || !updated) throw updateError

    // 3. Atualizar o Redis
    await redisSet(`link:${updated.shortCode}`, JSON.stringify({
      id: updated.id,
      originalUrl: updated.originalUrl,
      passwordRequired: updated.passwordRequired,
      password: updated.password,
      expiresAt: updated.expiresAt || null,
      isActive: updated.isActive,
    }), 3600)

    return NextResponse.json({ ...updated, tags: [] })
  } catch (error) {
    console.error('❌ Update link error:', error)
    return NextResponse.json({ error: 'Erro ao atualizar link' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 1. Verificar se o link pertence ao usuário
    const { data: link, error: fetchError } = await supabaseAdmin
      .from('Link')
      .select('id, userId')
      .eq('id', params.id)
      .single()

    if (fetchError || !link || link.userId !== userId) {
      return NextResponse.json({ error: 'Link não encontrado' }, { status: 404 })
    }

    // 2. Excluir o link definitivamente
    const { error: deleteError } = await supabaseAdmin
      .from('Link')
      .delete()
      .match({ id: params.id, userId: userId })

    if (deleteError) {
      console.error('❌ Erro ao deletar no Supabase:', deleteError)
      throw deleteError
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Delete link error:', error)
    return NextResponse.json({ error: 'Erro ao excluir link' }, { status: 500 })
  }
}
