import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { nanoid } from 'nanoid'

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: wh } = await supabaseAdmin
    .from('Webhook')
    .select('id')
    .eq('id', params.id)
    .eq('userId', session.user.id)
    .single()

  if (!wh) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  await supabaseAdmin.from('Webhook').delete().eq('id', params.id)
  return NextResponse.json({ success: true })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: wh } = await supabaseAdmin
    .from('Webhook')
    .select('id')
    .eq('id', params.id)
    .eq('userId', session.user.id)
    .single()

  if (!wh) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  const { active } = await req.json()
  const { data: webhook } = await supabaseAdmin
    .from('Webhook')
    .update({ active, updatedAt: new Date().toISOString() })
    .eq('id', params.id)
    .select()
    .single()

  return NextResponse.json({ webhook })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: wh } = await supabaseAdmin
    .from('Webhook')
    .select('*')
    .eq('id', params.id)
    .eq('userId', session.user.id)
    .single()

  if (!wh) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  const payload = JSON.stringify({
    event: 'test',
    message: 'Este é um evento de teste do 123bit Webhooks',
    timestamp: new Date().toISOString(),
  })

  try {
    const res = await fetch(wh.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(wh.secret ? { 'X-Webhook-Secret': wh.secret } : {}),
      },
      body: payload,
      signal: AbortSignal.timeout(8000),
    })

    await supabaseAdmin.from('WebhookDelivery').insert({
      id: nanoid(),
      webhookId: wh.id,
      event: 'test',
      payload,
      statusCode: res.status,
      success: res.ok,
      createdAt: new Date().toISOString(),
    })

    return NextResponse.json({ success: res.ok, statusCode: res.status })
  } catch {
    await supabaseAdmin.from('WebhookDelivery').insert({
      id: nanoid(),
      webhookId: wh.id,
      event: 'test',
      payload,
      success: false,
      createdAt: new Date().toISOString(),
    })
    return NextResponse.json({ success: false, error: 'Falha ao entregar o webhook' })
  }
}
