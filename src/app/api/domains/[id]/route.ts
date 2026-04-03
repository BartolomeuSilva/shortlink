import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = params

  try {
    const { data: domain } = await supabaseAdmin
      .from('Domain')
      .select('id')
      .eq('id', id)
      .eq('userId', userId)
      .single()

    if (!domain) {
      return NextResponse.json({ error: 'Domínio não encontrado' }, { status: 404 })
    }

    const { error } = await supabaseAdmin
      .from('Domain')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ message: 'Domínio removido' })
  } catch (error) {
    console.error('❌ Erro ao remover domínio:', error)
    return NextResponse.json({ error: 'Erro ao remover domínio' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = params
  const { verified } = await request.json()

  try {
    const { data: domain } = await supabaseAdmin
      .from('Domain')
      .select('id')
      .eq('id', id)
      .eq('userId', userId)
      .single()

    if (!domain) {
      return NextResponse.json({ error: 'Domínio não encontrado' }, { status: 404 })
    }

    const { data: updated, error } = await supabaseAdmin
      .from('Domain')
      .update({ verified, updatedAt: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ domain: updated })
  } catch (error) {
    console.error('❌ Erro ao atualizar domínio:', error)
    return NextResponse.json({ error: 'Erro ao atualizar domínio' }, { status: 500 })
  }
}
