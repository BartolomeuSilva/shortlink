import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const ALLOWED_EVENTS = ['link.clicked', 'link.created', 'link.expired']

const schema = z.object({
  name:   z.string().min(1).max(80),
  url:    z.string().url('URL inválida'),
  secret: z.string().max(100).optional(),
  events: z.array(z.string()).min(1, 'Selecione ao menos um evento'),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const webhooks = await prisma.webhook.findMany({
    where: { userId: session.user.id },
    include: {
      _count: { select: { deliveries: true } },
      deliveries: {
        orderBy: { deliveredAt: 'desc' },
        take: 1,
        select: { success: true, deliveredAt: true, statusCode: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ webhooks })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

  const validEvents = parsed.data.events.filter(e => ALLOWED_EVENTS.includes(e))
  if (validEvents.length === 0) return NextResponse.json({ error: 'Eventos inválidos' }, { status: 400 })

  const webhook = await prisma.webhook.create({
    data: {
      userId: session.user.id,
      name:   parsed.data.name,
      url:    parsed.data.url,
      secret: parsed.data.secret || null,
      events: validEvents,
    },
  })

  return NextResponse.json({ webhook }, { status: 201 })
}
