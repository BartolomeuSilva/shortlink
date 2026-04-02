import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

async function requireMember(wsId: string, userId: string, minRole?: string) {
  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: wsId, userId } },
  })
  if (!member) return null
  if (minRole === 'OWNER' && member.role !== 'OWNER') return null
  if (minRole === 'ADMIN' && !['OWNER', 'ADMIN'].includes(member.role)) return null
  return member
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const member = await requireMember(params.id, session.user.id)
  if (!member) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const workspace = await prisma.workspace.findUnique({
    where: { id: params.id },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true, image: true } } },
        orderBy: { joinedAt: 'asc' },
      },
    },
  })

  return NextResponse.json({ workspace, currentRole: member.role })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const member = await requireMember(params.id, session.user.id, 'OWNER')
  if (!member) return NextResponse.json({ error: 'Apenas o owner pode deletar o workspace' }, { status: 403 })

  await prisma.workspace.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}

// Invite member
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const member = await requireMember(params.id, session.user.id, 'ADMIN')
  if (!member) return NextResponse.json({ error: 'Permissão insuficiente' }, { status: 403 })

  const { email, role } = await req.json()
  const schema = z.object({
    email: z.string().email(),
    role:  z.enum(['ADMIN', 'EDITOR', 'VIEWER']),
  })
  const parsed = schema.safeParse({ email, role })
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } })
  if (!user) return NextResponse.json({ error: 'Usuário não encontrado com este email' }, { status: 404 })

  const existing = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: params.id, userId: user.id } },
  })
  if (existing) return NextResponse.json({ error: 'Usuário já é membro deste workspace' }, { status: 409 })

  const newMember = await prisma.workspaceMember.create({
    data: { workspaceId: params.id, userId: user.id, role: parsed.data.role },
    include: { user: { select: { id: true, name: true, email: true, image: true } } },
  })

  return NextResponse.json({ member: newMember }, { status: 201 })
}

// Remove member / update role
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  if (body.action === 'remove_member') {
    const member = await requireMember(params.id, session.user.id, 'ADMIN')
    if (!member) return NextResponse.json({ error: 'Permissão insuficiente' }, { status: 403 })

    await prisma.workspaceMember.deleteMany({
      where: { workspaceId: params.id, userId: body.userId, role: { not: 'OWNER' } },
    })
    return NextResponse.json({ success: true })
  }

  if (body.action === 'update_role') {
    const member = await requireMember(params.id, session.user.id, 'OWNER')
    if (!member) return NextResponse.json({ error: 'Apenas o owner pode alterar roles' }, { status: 403 })

    await prisma.workspaceMember.updateMany({
      where: { workspaceId: params.id, userId: body.userId },
      data: { role: body.role },
    })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Ação não reconhecida' }, { status: 400 })
}
