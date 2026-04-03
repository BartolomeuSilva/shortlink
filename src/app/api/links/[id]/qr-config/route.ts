import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { nanoid } from 'nanoid'
import { z } from 'zod'

const schema = z.object({
  fgColor:     z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().default('#000000'),
  bgColor:     z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().default('#FFFFFF'),
  cornerStyle: z.enum(['square', 'rounded']).optional().default('square'),
  errorLevel:  z.enum(['L', 'M', 'Q', 'H']).optional().default('M'),
  frameText:   z.string().max(40).optional(),
  logoUrl:     z.string().url().optional().or(z.literal('')),
})

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: link } = await supabaseAdmin
    .from('Link')
    .select('id')
    .eq('id', params.id)
    .eq('userId', session.user.id)
    .single()

  if (!link) return NextResponse.json({ error: 'Link não encontrado' }, { status: 404 })

  const { data: qrConfig } = await supabaseAdmin
    .from('QRConfig')
    .select('*')
    .eq('linkId', params.id)
    .single()

  return NextResponse.json({ qrConfig })
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: link } = await supabaseAdmin
    .from('Link')
    .select('id')
    .eq('id', params.id)
    .eq('userId', session.user.id)
    .single()

  if (!link) return NextResponse.json({ error: 'Link não encontrado' }, { status: 404 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

  const data = {
    fgColor:     parsed.data.fgColor,
    bgColor:     parsed.data.bgColor,
    cornerStyle: parsed.data.cornerStyle,
    errorLevel:  parsed.data.errorLevel,
    frameText:   parsed.data.frameText || null,
    logoUrl:     parsed.data.logoUrl || null,
    updatedAt:   new Date().toISOString(),
  }

  const { data: existing } = await supabaseAdmin
    .from('QRConfig')
    .select('id')
    .eq('linkId', params.id)
    .single()

  let qrConfig
  if (existing) {
    const { data: updatedQr } = await supabaseAdmin.from('QRConfig').update(data).eq('linkId', params.id).select().single()
    qrConfig = updatedQr
  } else {
    const { data: insertedQr } = await supabaseAdmin.from('QRConfig').insert({ id: nanoid(), linkId: params.id, ...data, createdAt: new Date().toISOString() }).select().single()
    qrConfig = insertedQr
  }

  return NextResponse.json({ qrConfig })
}
