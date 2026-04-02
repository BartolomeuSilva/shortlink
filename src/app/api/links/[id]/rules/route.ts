import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const ruleSchema = z.object({
  type: z.enum(['geo', 'device', 'time', 'ab']),
  condition: z.record(z.unknown()),
  destination: z.string().url('URL de destino inválida'),
  weight: z.number().int().min(1).max(100).optional().default(100),
  order: z.number().int().min(0).optional().default(0),
})

async function verifyLinkOwner(linkId: string, userId: string) {
  return prisma.link.findFirst({ where: { id: linkId, userId } })
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const link = await verifyLinkOwner(params.id, session.user.id)
  if (!link) return NextResponse.json({ error: 'Link não encontrado' }, { status: 404 })

  const rules = await prisma.redirectRule.findMany({
    where: { linkId: params.id },
    orderBy: { order: 'asc' },
  })

  return NextResponse.json({ rules })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const link = await verifyLinkOwner(params.id, session.user.id)
  if (!link) return NextResponse.json({ error: 'Link não encontrado' }, { status: 404 })

  const body = await req.json()
  const parsed = ruleSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

  const { type, condition, destination, weight, order } = parsed.data

  const rule = await prisma.redirectRule.create({
    data: {
      linkId: params.id,
      type,
      condition: JSON.stringify(condition),
      destination,
      weight,
      order,
    },
  })

  return NextResponse.json({ rule }, { status: 201 })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const link = await verifyLinkOwner(params.id, session.user.id)
  if (!link) return NextResponse.json({ error: 'Link não encontrado' }, { status: 404 })

  const { ruleId } = await req.json()

  await prisma.redirectRule.deleteMany({
    where: { id: ruleId, linkId: params.id },
  })

  return NextResponse.json({ success: true })
}
