import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { nanoid } from 'nanoid'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const workspaceId = searchParams.get('workspaceId')

  // Buscar campanhas com contagem de links e cliques filtradas por espaço
  let query = supabaseAdmin
    .from('Campaign')
    .select(`
      *,
      links:Link(id, clickCount)
    `)

  if (workspaceId) {
    // Verificar se o usuário é membro do workspace
    const { data: member } = await supabaseAdmin
      .from('WorkspaceMember')
      .select('id')
      .eq('workspaceId', workspaceId)
      .eq('userId', session.user.id)
      .single()
    
    if (!member) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    query = query.eq('workspaceId', workspaceId)
  } else {
    query = query.eq('userId', session.user.id).is('workspaceId', null)
  }

  const { data: campaigns, error } = await query.order('createdAt', { ascending: false })

  if (error) {
    console.error('❌ Erro ao buscar campanhas:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const formattedCampaigns = campaigns.map(c => {
    const links = c.links || []
    return {
      id: c.id,
      name: c.name,
      description: c.description,
      createdAt: c.createdAt,
      linkCount: links.length,
      totalClicks: links.reduce((acc: number, curr: any) => acc + (curr.clickCount || 0), 0)
    }
  })

  return NextResponse.json({ campaigns: formattedCampaigns })
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { name, description, workspaceId } = await request.json()
    if (!name) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    }

    const now = new Date().toISOString()
    const { data: campaign, error } = await supabaseAdmin
      .from('Campaign')
      .insert([
        {
          id: nanoid(),
          userId: session.user.id,
          workspaceId: workspaceId || null,
          name,
          description,
          createdAt: now,
          updatedAt: now,
        }
      ])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ campaign }, { status: 201 })
  } catch (error: any) {
    console.error('❌ Erro ao criar campanha:', error)
    return NextResponse.json({ error: 'Erro ao criar campanha' }, { status: 500 })
  }
}
