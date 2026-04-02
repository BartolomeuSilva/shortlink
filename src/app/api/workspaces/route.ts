import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1).max(80),
  slug: z.string().min(2).max(40).regex(/^[a-z0-9-]+$/, 'Apenas letras minúsculas, números e hífens'),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const memberships = await prisma.workspaceMember.findMany({
    where: { userId: session.user.id },
    include: {
      workspace: {
        include: {
          _count: { select: { members: true } },
        },
      },
    },
    orderBy: { joinedAt: 'asc' },
  })

  const workspaces = memberships.map(m => ({
    ...m.workspace,
    role: m.role,
    memberCount: m.workspace._count.members,
  }))

  return NextResponse.json({ workspaces })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

  const existing = await prisma.workspace.findUnique({ where: { slug: parsed.data.slug } })
  if (existing) return NextResponse.json({ error: 'Este slug já está em uso' }, { status: 409 })

  const workspace = await prisma.$transaction(async tx => {
    const ws = await tx.workspace.create({ data: { name: parsed.data.name, slug: parsed.data.slug } })
    await tx.workspaceMember.create({
      data: { workspaceId: ws.id, userId: session.user.id, role: 'OWNER' },
    })
    return ws
  })

  return NextResponse.json({ workspace }, { status: 201 })
}
