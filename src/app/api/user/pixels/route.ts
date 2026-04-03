import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { z } from 'zod'

const schema = z.object({
  metaPixelId:    z.string().max(30).optional().or(z.literal('')),
  googleTagId:    z.string().max(30).optional().or(z.literal('')),
  tiktokPixelId:  z.string().max(30).optional().or(z.literal('')),
  linkedinTagId:  z.string().max(20).optional().or(z.literal('')),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { data: user, error } = await supabaseAdmin
      .from('User')
      .select('metaPixelId, googleTagId, tiktokPixelId, linkedinTagId')
      .eq('id', session.user.id)
      .single()

    if (error) throw error

    return NextResponse.json({ pixels: user })
  } catch (err: any) {
    console.error('❌ Erro ao buscar pixels:', err)
    return NextResponse.json({ error: 'Erro ao carregar pixels' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

    const { data: user, error } = await supabaseAdmin
      .from('User')
      .update({
        metaPixelId:   parsed.data.metaPixelId   || null,
        googleTagId:   parsed.data.googleTagId   || null,
        tiktokPixelId: parsed.data.tiktokPixelId || null,
        linkedinTagId: parsed.data.linkedinTagId || null,
        updatedAt: new Date().toISOString()
      })
      .eq('id', session.user.id)
      .select('metaPixelId, googleTagId, tiktokPixelId, linkedinTagId')
      .single()

    if (error) throw error

    return NextResponse.json({ pixels: user })
  } catch (err: any) {
    console.error('❌ Erro ao atualizar pixels:', err)
    return NextResponse.json({ error: 'Erro ao salvar pixels' }, { status: 500 })
  }
}
