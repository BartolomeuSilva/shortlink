import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const wh = await prisma.webhook.findFirst({ where: { id: params.id, userId: session.user.id } })
  if (!wh) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  await prisma.webhook.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const wh = await prisma.webhook.findFirst({ where: { id: params.id, userId: session.user.id } })
  if (!wh) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  const { active } = await req.json()
  const updated = await prisma.webhook.update({ where: { id: params.id }, data: { active } })
  return NextResponse.json({ webhook: updated })
}

// POST /api/webhooks/[id]/test
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const wh = await prisma.webhook.findFirst({ where: { id: params.id, userId: session.user.id } })
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

    await prisma.webhookDelivery.create({
      data: {
        webhookId: wh.id,
        event: 'test',
        payload,
        statusCode: res.status,
        success: res.ok,
      },
    })

    return NextResponse.json({ success: res.ok, statusCode: res.status })
  } catch {
    await prisma.webhookDelivery.create({
      data: { webhookId: wh.id, event: 'test', payload, success: false },
    })
    return NextResponse.json({ success: false, error: 'Falha ao entregar o webhook' })
  }
}
