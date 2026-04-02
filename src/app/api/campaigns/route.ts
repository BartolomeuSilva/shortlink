import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const campaigns = await prisma.campaign.findMany({
    where: { userId: session.user.id },
    include: {
      _count: { select: { links: true } },
      links: {
        select: { clickCount: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const data = campaigns.map(c => ({
    id: c.id,
    name: c.name,
    description: c.description,
    createdAt: c.createdAt,
    linkCount: c._count.links,
    totalClicks: c.links.reduce((s, l) => s + l.clickCount, 0),
  }))

  return NextResponse.json({ campaigns: data })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

  const campaign = await prisma.campaign.create({
    data: { userId: session.user.id, name: parsed.data.name, description: parsed.data.description || null },
  })

  return NextResponse.json({ campaign }, { status: 201 })
}
