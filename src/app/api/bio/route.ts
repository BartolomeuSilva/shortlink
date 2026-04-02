import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const pageSchema = z.object({
  username:    z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/, 'Apenas letras, números, - e _'),
  title:       z.string().max(80).optional(),
  bio:         z.string().max(200).optional(),
  theme:       z.enum(['dark', 'light', 'purple']).optional().default('dark'),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().default('#8B5CF6'),
  published:   z.boolean().optional().default(true),
})

const itemSchema = z.object({
  label:  z.string().min(1).max(60),
  url:    z.string().url('URL inválida'),
  icon:   z.string().nullable().optional(),
  order:  z.number().int().min(0).optional().default(0),
  active: z.boolean().optional().default(true),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const bio = await prisma.bioPage.findUnique({
    where: { userId: session.user.id },
    include: { items: { orderBy: { order: 'asc' } } },
  })

  return NextResponse.json({ bio })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  if (body.action === 'add_item') {
    const bio = await prisma.bioPage.findUnique({ where: { userId: session.user.id } })
    if (!bio) return NextResponse.json({ error: 'Página bio não encontrada. Crie a página primeiro.' }, { status: 404 })

    const parsed = itemSchema.safeParse(body.item)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

    const item = await prisma.bioPageItem.create({
      data: { bioPageId: bio.id, ...parsed.data },
    })
    return NextResponse.json({ item }, { status: 201 })
  }

  // Create page
  const parsed = pageSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

  const existing = await prisma.bioPage.findUnique({ where: { username: parsed.data.username } })
  if (existing && existing.userId !== session.user.id) {
    return NextResponse.json({ error: 'Este username já está em uso' }, { status: 409 })
  }

  const bio = await prisma.bioPage.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, ...parsed.data },
    update: parsed.data,
    include: { items: { orderBy: { order: 'asc' } } },
  })

  return NextResponse.json({ bio })
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  // Update item order (drag-and-drop)
  if (body.action === 'reorder' && Array.isArray(body.items)) {
    const bio = await prisma.bioPage.findUnique({ where: { userId: session.user.id } })
    if (!bio) return NextResponse.json({ error: 'Bio não encontrada' }, { status: 404 })

    await Promise.all(
      (body.items as { id: string; order: number }[]).map(({ id, order }) =>
        prisma.bioPageItem.updateMany({ where: { id, bioPageId: bio.id }, data: { order } })
      )
    )
    return NextResponse.json({ success: true })
  }

  // Update single item
  if (body.action === 'update_item' && body.itemId) {
    const bio = await prisma.bioPage.findUnique({ where: { userId: session.user.id } })
    if (!bio) return NextResponse.json({ error: 'Bio não encontrada' }, { status: 404 })

    const item = await prisma.bioPageItem.updateMany({
      where: { id: body.itemId, bioPageId: bio.id },
      data: { active: body.active, label: body.label, url: body.url },
    })
    return NextResponse.json({ success: true, item })
  }

  // Delete item
  if (body.action === 'delete_item' && body.itemId) {
    const bio = await prisma.bioPage.findUnique({ where: { userId: session.user.id } })
    if (!bio) return NextResponse.json({ error: 'Bio não encontrada' }, { status: 404 })

    await prisma.bioPageItem.deleteMany({ where: { id: body.itemId, bioPageId: bio.id } })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Ação não reconhecida' }, { status: 400 })
}
