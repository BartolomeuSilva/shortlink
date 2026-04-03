import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { nanoid } from 'nanoid'
import { z } from 'zod'

const schema = z.object({
  iosAppId:        z.string().max(100).optional().or(z.literal('')),
  androidPackage:  z.string().max(200).optional().or(z.literal('')),
  iosStoreUrl:     z.string().url().optional().or(z.literal('')),
  androidStoreUrl: z.string().url().optional().or(z.literal('')),
})

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: domain } = await supabaseAdmin
    .from('Domain')
    .select('id')
    .eq('id', params.id)
    .eq('userId', session.user.id)
    .single()

  if (!domain) return NextResponse.json({ error: 'Domínio não encontrado' }, { status: 404 })

  const { data: deepLinkConfig } = await supabaseAdmin
    .from('DeepLinkConfig')
    .select('*')
    .eq('domainId', params.id)
    .single()

  return NextResponse.json({ deepLinkConfig })
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: domain } = await supabaseAdmin
    .from('Domain')
    .select('id')
    .eq('id', params.id)
    .eq('userId', session.user.id)
    .single()

  if (!domain) return NextResponse.json({ error: 'Domínio não encontrado' }, { status: 404 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

  const data = {
    iosAppId:        parsed.data.iosAppId        || null,
    androidPackage:  parsed.data.androidPackage  || null,
    iosStoreUrl:     parsed.data.iosStoreUrl     || null,
    androidStoreUrl: parsed.data.androidStoreUrl || null,
    updatedAt:       new Date().toISOString(),
  }

  const { data: existing } = await supabaseAdmin
    .from('DeepLinkConfig')
    .select('id')
    .eq('domainId', params.id)
    .single()

  let deepLinkConfig
  if (existing) {
    const { data: updated } = await supabaseAdmin.from('DeepLinkConfig').update(data).eq('domainId', params.id).select().single()
    deepLinkConfig = updated
  } else {
    const { data: created } = await supabaseAdmin.from('DeepLinkConfig').insert({ id: nanoid(), domainId: params.id, ...data, createdAt: new Date().toISOString() }).select().single()
    deepLinkConfig = created
  }

  return NextResponse.json({ deepLinkConfig })
}
