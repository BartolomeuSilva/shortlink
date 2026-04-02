import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const updateSchema = z.object({
  title: z.string().max(80).optional(),
  bio: z.string().max(200).optional(),
  theme: z.enum(['dark', 'light', 'purple']).optional(),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  published: z.boolean().optional(),
  slug: z.string().min(2).max(30).regex(/^[a-z0-9-]+$/, 'Apenas letras minúsculas, números e hífen').optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const bio = await prisma.bioPage.findUnique({ where: { id: params.id } })
  if (!bio || bio.userId !== session.user.id) {
    return NextResponse.json({ error: 'Bio não encontrada' }, { status: 404 })
  }

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

  if (parsed.data.slug && parsed.data.slug !== bio.slug) {
    const existing = await prisma.bioPage.findFirst({
      where: { userId: session.user.id, slug: parsed.data.slug },
    })
    if (existing) return NextResponse.json({ error: 'Este slug já está em uso' }, { status: 409 })
  }

  const updated = await prisma.bioPage.update({
    where: { id: params.id },
    data: parsed.data,
    include: { items: { orderBy: { order: 'asc' } } },
  })

  return NextResponse.json({ bio: updated })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const bio = await prisma.bioPage.findUnique({ where: { id: params.id } })
  if (!bio || bio.userId !== session.user.id) {
    return NextResponse.json({ error: 'Bio não encontrada' }, { status: 404 })
  }

  await prisma.bioPage.delete({ where: { id: params.id } })

  return NextResponse.json({ success: true })
}
