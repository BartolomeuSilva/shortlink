import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { z } from 'zod'
import { nanoid } from 'nanoid'

const schema = z.object({
  name: z.string().min(1).max(80),
  slug: z.string().min(2).max(40).regex(/^[a-z0-9-]+$/, 'Apenas letras minúsculas, números e hífens'),
})

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: memberships, error } = await supabaseAdmin
      .from('WorkspaceMember')
      .select(`
        role,
        workspace:Workspace (
          *,
          members:WorkspaceMember(count)
        )
      `)
      .eq('userId', session.user.id)
      .order('joinedAt', { ascending: true })

    if (error) throw error

    const workspaces = (memberships || []).map((m: any) => ({
      ...m.workspace,
      role: m.role,
      memberCount: m.workspace.members[0].count,
    }))

    return NextResponse.json({ workspaces })
  } catch (err: any) {
    console.error('❌ Erro ao buscar workspaces:', err)
    return NextResponse.json({ error: err?.message || 'Erro ao carregar workspaces' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

    const { name, slug } = parsed.data

    // 1. Verificar se slug já existe
    const { data: existing } = await supabaseAdmin
      .from('Workspace')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existing) return NextResponse.json({ error: 'Este slug já está em uso' }, { status: 409 })

    const now = new Date().toISOString()
    const workspaceId = nanoid()

    // 2. Criar Workspace
    const { data: workspace, error: wsError } = await supabaseAdmin
      .from('Workspace')
      .insert([{ id: workspaceId, name, slug, plan: 'FREE', createdAt: now, updatedAt: now }])
      .select()
      .single()

    if (wsError) throw wsError

    // 3. Criar Membro (Owner)
    const { error: memberError } = await supabaseAdmin
      .from('WorkspaceMember')
      .insert([{ id: nanoid(), workspaceId, userId, role: 'OWNER', joinedAt: now }])

    if (memberError) throw memberError

    return NextResponse.json({ workspace }, { status: 201 })
  } catch (err: any) {
    console.error('❌ Erro ao criar workspace:', err)
    return NextResponse.json({ error: err?.message || err?.code || 'Erro ao criar workspace' }, { status: 500 })
  }
}
