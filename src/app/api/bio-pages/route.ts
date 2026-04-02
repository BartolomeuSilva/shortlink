import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const createSchema = z.object({
  slug: z.string().min(2).max(30).regex(/^[a-z0-9-]+$/, 'Apenas letras minúsculas, números e hífen'),
  title: z.string().max(80).optional(),
  theme: z.enum(['dark', 'light', 'purple']).optional().default('dark'),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().default('#8B5CF6'),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const bios = await prisma.bioPage.findMany({
    where: { userId: session.user.id },
    include: { items: { orderBy: { order: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ bios })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

  const existing = await prisma.bioPage.findFirst({
    where: { userId: session.user.id, slug: parsed.data.slug },
  })
  if (existing) return NextResponse.json({ error: 'Este slug já está em uso' }, { status: 409 })

  const bio = await prisma.bioPage.create({
    data: { userId: session.user.id, slug: parsed.data.slug, title: parsed.data.title || null, theme: parsed.data.theme, accentColor: parsed.data.accentColor },
    include: { items: { orderBy: { order: 'asc' } } },
  })

  return NextResponse.json({ bio }, { status: 201 })
}
