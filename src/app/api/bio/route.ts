import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { nanoid } from 'nanoid'
import { z } from 'zod'

const pageSchema = z.object({
  slug:        z.string().min(2).max(30).regex(/^[a-z0-9-]+$/, 'Apenas letras minúsculas, números e hífen'),
  title:       z.string().max(80).optional(),
  bio:         z.string().max(200).optional(),
  profileImage: z.string().url().optional().nullable().or(z.literal('')),
  theme:       z.enum(['dark', 'light', 'purple']).optional().default('dark'),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().default('#8B5CF6'),
  published:   z.boolean().optional().default(true),
})

const itemSchema = z.object({
  label:  z.string().min(1).max(60),
  url:    z.string().url('URL inválida'),
  icon:   z.string().nullable().optional(),
  order:  z.number().int().min(0).optional().default(0),
  active: z.boolean().optional().default(true),
})

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const slug = searchParams.get('slug')

  let query = supabaseAdmin
    .from('BioPage')
    .select('*, items:BioPageItem(*)')
    .eq('userId', session.user.id)
    .order('order', { referencedTable: 'BioPageItem', ascending: true })

  if (slug) query = query.eq('slug', slug)

  const { data: bio } = await query.maybeSingle()

  return NextResponse.json({ bio: bio || null })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { searchParams } = new URL(req.url)
  const slug = searchParams.get('slug')
  const now = new Date().toISOString()

  if (body.action === 'add_item') {
    let bioQuery = supabaseAdmin.from('BioPage').select('id').eq('userId', session.user.id)
    if (slug) bioQuery = bioQuery.eq('slug', slug)
    const { data: bioPage } = await bioQuery.maybeSingle()
    if (!bioPage) return NextResponse.json({ error: 'Página bio não encontrada. Crie a página primeiro.' }, { status: 404 })

    const parsed = itemSchema.safeParse(body.item)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

    const { data: item, error } = await supabaseAdmin
      .from('BioPageItem')
      .insert({ id: nanoid(), bioPageId: bioPage.id, ...parsed.data, clicks: 0 })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ item }, { status: 201 })
  }

  // Create/update page
  const parsed = pageSchema.safeParse(body)
  if (!parsed.success) {
    console.error('🔴 Zod parse error:', parsed.error.errors)
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const normalizedProfileImage = parsed.data.profileImage === '' ? null : parsed.data.profileImage

  const { data: existing } = await supabaseAdmin
    .from('BioPage')
    .select('id, title, bio, profileImage')
    .eq('userId', session.user.id)
    .eq('slug', parsed.data.slug)
    .maybeSingle()

  if (existing) {
    console.log('🔵 Bio update:', { id: existing.id, profileImage: normalizedProfileImage })
    const { data: bio, error: updateError } = await supabaseAdmin
      .from('BioPage')
      .update({
        title: parsed.data.title ?? existing.title,
        bio: parsed.data.bio ?? existing.bio,
        profileImage: normalizedProfileImage ?? existing.profileImage,
        theme: parsed.data.theme,
        accentColor: parsed.data.accentColor,
        published: parsed.data.published,
        updatedAt: now,
      })
      .eq('id', existing.id)
      .select('*, items:BioPageItem(*)')
      .single()
    if (updateError) console.error('🔴 Bio update error:', updateError)
    console.log('🟢 Bio updated:', { profileImage: bio?.profileImage })
    return NextResponse.json({ bio })
  }

  const { data: bio, error } = await supabaseAdmin
    .from('BioPage')
    .insert({
      id: nanoid(),
      userId: session.user.id,
      slug: parsed.data.slug,
      title: parsed.data.title || null,
      bio: parsed.data.bio || null,
      profileImage: normalizedProfileImage || null,
      theme: parsed.data.theme,
      accentColor: parsed.data.accentColor,
      published: parsed.data.published,
      clicksTotal: 0,
      createdAt: now,
      updatedAt: now,
    })
    .select('*, items:BioPageItem(*)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ bio })
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const slug = searchParams.get('slug')

  let bioQuery = supabaseAdmin.from('BioPage').select('id').eq('userId', session.user.id)
  if (slug) bioQuery = bioQuery.eq('slug', slug)
  const { data: bio } = await bioQuery.maybeSingle()

  if (!bio) return NextResponse.json({ error: 'Bio não encontrada' }, { status: 404 })

  const body = await req.json()
  const now = new Date().toISOString()

  if (body.action === 'reorder' && Array.isArray(body.items)) {
    await Promise.all(
      (body.items as { id: string; order: number }[]).map(({ id, order }) =>
        supabaseAdmin.from('BioPageItem').update({ order }).eq('id', id).eq('bioPageId', bio.id)
      )
    )
    return NextResponse.json({ success: true })
  }

  if (body.action === 'update_item' && body.itemId) {
    await supabaseAdmin
      .from('BioPageItem')
      .update({ active: body.active, label: body.label, url: body.url })
      .eq('id', body.itemId)
      .eq('bioPageId', bio.id)
    return NextResponse.json({ success: true })
  }

  if (body.action === 'delete_item' && body.itemId) {
    await supabaseAdmin.from('BioPageItem').delete().eq('id', body.itemId).eq('bioPageId', bio.id)
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Ação não reconhecida' }, { status: 400 })
}
