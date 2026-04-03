import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { data: apiKey } = await supabaseAdmin
      .from('ApiKey')
      .select('id, userId')
      .eq('id', params.id)
      .single()

    if (!apiKey || apiKey.userId !== session.user.id) {
      return NextResponse.json({ error: 'API key não encontrada' }, { status: 404 })
    }

    await supabaseAdmin
      .from('ApiKey')
      .update({ revokedAt: new Date().toISOString() })
      .eq('id', params.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API key deletion error:', error)
    return NextResponse.json({ error: 'Erro ao deletar API key' }, { status: 500 })
  }
}
