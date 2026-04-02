import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const link = await prisma.link.findUnique({
    where: { id: params.id },
    select: { userId: true, redirectRules: { orderBy: { order: 'asc' } } },
  })

  if (!link || link.userId !== session.user.id) {
    return NextResponse.json({ error: 'Link not found' }, { status: 404 })
  }

  return NextResponse.json({ rules: link.redirectRules })
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const link = await prisma.link.findUnique({
    where: { id: params.id },
    select: { userId: true },
  })

  if (!link || link.userId !== session.user.id) {
    return NextResponse.json({ error: 'Link not found' }, { status: 404 })
  }

  const body = await req.json()
  const { type, condition, destination, weight = 100, order = 0, active = true } = body

  if (!type || !destination) {
    return NextResponse.json({ error: 'Type and destination are required' }, { status: 400 })
  }

  const rule = await prisma.redirectRule.create({
    data: {
      linkId: params.id,
      type,
      condition: typeof condition === 'string' ? condition : JSON.stringify(condition),
      destination,
      weight,
      order,
      active,
    },
  })

  return NextResponse.json({ rule }, { status: 201 })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { ruleId, ...data } = body

  const link = await prisma.link.findUnique({
    where: { id: params.id },
    select: { userId: true },
  })

  if (!link || link.userId !== session.user.id) {
    return NextResponse.json({ error: 'Link not found' }, { status: 404 })
  }

  const existingRule = await prisma.redirectRule.findUnique({
    where: { id: ruleId },
  })

  if (!existingRule || existingRule.linkId !== params.id) {
    return NextResponse.json({ error: 'Rule not found' }, { status: 404 })
  }

  const updateData: Record<string, unknown> = {}
  if (data.type !== undefined) updateData.type = data.type
  if (data.condition !== undefined) updateData.condition = typeof data.condition === 'string' ? data.condition : JSON.stringify(data.condition)
  if (data.destination !== undefined) updateData.destination = data.destination
  if (data.weight !== undefined) updateData.weight = data.weight
  if (data.order !== undefined) updateData.order = data.order
  if (data.active !== undefined) updateData.active = data.active

  const rule = await prisma.redirectRule.update({
    where: { id: ruleId },
    data: updateData,
  })

  return NextResponse.json({ rule })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const ruleId = searchParams.get('ruleId')

  if (!ruleId) return NextResponse.json({ error: 'ruleId required' }, { status: 400 })

  const link = await prisma.link.findUnique({
    where: { id: params.id },
    select: { userId: true },
  })

  if (!link || link.userId !== session.user.id) {
    return NextResponse.json({ error: 'Link not found' }, { status: 404 })
  }

  await prisma.redirectRule.deleteMany({
    where: { id: ruleId, linkId: params.id },
  })

  return NextResponse.json({ success: true })
}
