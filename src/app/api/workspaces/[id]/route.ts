import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { nanoid } from 'nanoid'
import { z } from 'zod'

async function requireMember(wsId: string, userId: string, minRole?: string) {
  const { data: member } = await supabaseAdmin
    .from('WorkspaceMember')
    .select('role')
    .eq('workspaceId', wsId)
    .eq('userId', userId)
    .single()

  if (!member) return null
  if (minRole === 'OWNER' && member.role !== 'OWNER') return null
  if (minRole === 'ADMIN' && !['OWNER', 'ADMIN'].includes(member.role)) return null
  return member
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const member = await requireMember(params.id, session.user.id)
  if (!member) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const { data: workspace } = await supabaseAdmin
    .from('Workspace')
    .select(`
      *,
      members:WorkspaceMember(
        role, joinedAt,
        user:User(id, name, email, image)
      )
    `)
    .eq('id', params.id)
    .single()

  return NextResponse.json({ workspace, currentRole: member.role })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const member = await requireMember(params.id, session.user.id, 'OWNER')
  if (!member) return NextResponse.json({ error: 'Apenas o owner pode deletar o workspace' }, { status: 403 })

  await supabaseAdmin.from('Workspace').delete().eq('id', params.id)
  return NextResponse.json({ success: true })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const member = await requireMember(params.id, session.user.id, 'ADMIN')
  if (!member) return NextResponse.json({ error: 'Permissão insuficiente' }, { status: 403 })

  const { email, role } = await req.json()
  const schema = z.object({ email: z.string().email(), role: z.enum(['ADMIN', 'EDITOR', 'VIEWER']) })
  const parsed = schema.safeParse({ email, role })
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

  const { data: user } = await supabaseAdmin
    .from('User')
    .select('id, name, email, image')
    .eq('email', parsed.data.email)
    .single()

  if (!user) return NextResponse.json({ error: 'Usuário não encontrado com este email' }, { status: 404 })

  const { data: existing } = await supabaseAdmin
    .from('WorkspaceMember')
    .select('id')
    .eq('workspaceId', params.id)
    .eq('userId', user.id)
    .single()

  if (existing) return NextResponse.json({ error: 'Usuário já é membro deste workspace' }, { status: 409 })

  const { data: newMember } = await supabaseAdmin
    .from('WorkspaceMember')
    .insert({ id: nanoid(), workspaceId: params.id, userId: user.id, role: parsed.data.role, joinedAt: new Date().toISOString() })
    .select('role, joinedAt, user:User(id, name, email, image)')
    .single()

  return NextResponse.json({ member: newMember }, { status: 201 })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  if (body.action === 'remove_member') {
    const member = await requireMember(params.id, session.user.id, 'ADMIN')
    if (!member) return NextResponse.json({ error: 'Permissão insuficiente' }, { status: 403 })

    await supabaseAdmin
      .from('WorkspaceMember')
      .delete()
      .eq('workspaceId', params.id)
      .eq('userId', body.userId)
      .neq('role', 'OWNER')
    return NextResponse.json({ success: true })
  }

  if (body.action === 'update_role') {
    const member = await requireMember(params.id, session.user.id, 'OWNER')
    if (!member) return NextResponse.json({ error: 'Apenas o owner pode alterar roles' }, { status: 403 })

    await supabaseAdmin
      .from('WorkspaceMember')
      .update({ role: body.role })
      .eq('workspaceId', params.id)
      .eq('userId', body.userId)
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Ação não reconhecida' }, { status: 400 })
}
