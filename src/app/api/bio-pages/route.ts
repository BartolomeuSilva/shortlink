import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { z } from 'zod'
import { nanoid } from 'nanoid'

const createSchema = z.object({
  slug: z.string().min(2).max(30).regex(/^[a-z0-9-]+$/, 'Apenas letras minúsculas, números e hífen'),
  title: z.string().max(80).optional(),
  theme: z.enum(['dark', 'light', 'purple']).optional().default('dark'),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().default('#8B5CF6'),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { data: bios, error } = await supabaseAdmin
      .from('BioPage')
      .select('*, items:BioPageItem(*)')
      .eq('userId', session.user.id)
      .order('createdAt', { ascending: false })

    if (error) throw error

    return NextResponse.json({ bios: bios || [] })
  } catch (err: any) {
    console.error('❌ Erro ao buscar BioPages:', err)
    return NextResponse.json({ error: 'Erro ao carregar bio pages' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

    const { slug, title, theme, accentColor } = parsed.data

    // 1. Verificar se slug já existe para este usuário
    const { data: existing } = await supabaseAdmin
      .from('BioPage')
      .select('id')
      .eq('userId', session.user.id)
      .eq('slug', slug)
      .single()

    if (existing) return NextResponse.json({ error: 'Este slug já está em uso' }, { status: 409 })

    const now = new Date().toISOString()
    const { data: bio, error: createError } = await supabaseAdmin
      .from('BioPage')
      .insert([
        {
          id: nanoid(),
          userId: session.user.id,
          slug,
          title: title || null,
          theme,
          accentColor,
          createdAt: now,
          updatedAt: now
        }
      ])
      .select()
      .single()

    if (createError) throw createError

    return NextResponse.json({ bio: { ...bio, items: [] } }, { status: 201 })
  } catch (err: any) {
    console.error('❌ Erro ao criar BioPage:', err)
    return NextResponse.json({ error: 'Erro ao criar bio page' }, { status: 500 })
  }
}
