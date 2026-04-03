import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { z } from 'zod'

const updateSchema = z.object({
  title:       z.string().max(80).optional(),
  bio:         z.string().max(200).optional(),
  theme:       z.enum(['dark', 'light', 'purple']).optional(),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  published:   z.boolean().optional(),
  slug:        z.string().min(2).max(30).regex(/^[a-z0-9-]+$/, 'Apenas letras minúsculas, números e hífen').optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: bio } = await supabaseAdmin
    .from('BioPage')
    .select('id, userId, slug')
    .eq('id', params.id)
    .single()

  if (!bio || bio.userId !== session.user.id) return NextResponse.json({ error: 'Bio não encontrada' }, { status: 404 })

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

  if (parsed.data.slug && parsed.data.slug !== bio.slug) {
    const { data: existing } = await supabaseAdmin
      .from('BioPage')
      .select('id')
      .eq('userId', session.user.id)
      .eq('slug', parsed.data.slug)
      .single()
    if (existing) return NextResponse.json({ error: 'Este slug já está em uso' }, { status: 409 })
  }

  const { data: updated } = await supabaseAdmin
    .from('BioPage')
    .update({ ...parsed.data, updatedAt: new Date().toISOString() })
    .eq('id', params.id)
    .select('*, items:BioPageItem(*)')
    .single()

  return NextResponse.json({ bio: updated })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: bio } = await supabaseAdmin
    .from('BioPage')
    .select('id, userId')
    .eq('id', params.id)
    .single()

  if (!bio || bio.userId !== session.user.id) return NextResponse.json({ error: 'Bio não encontrada' }, { status: 404 })

  await supabaseAdmin.from('BioPage').delete().eq('id', params.id)
  return NextResponse.json({ success: true })
}
