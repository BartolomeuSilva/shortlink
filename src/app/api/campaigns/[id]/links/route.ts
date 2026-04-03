import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

async function requireCampaignOwner(campaignId: string, userId: string) {
  const { data } = await supabaseAdmin
    .from('Campaign')
    .select('id')
    .eq('id', campaignId)
    .eq('userId', userId)
    .single()
  return data
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const campaign = await requireCampaignOwner(params.id, session.user.id)
  if (!campaign) return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 })

  const { linkId } = await req.json()
  if (!linkId) return NextResponse.json({ error: 'linkId obrigatório' }, { status: 400 })

  const { data: link } = await supabaseAdmin
    .from('Link')
    .select('id')
    .eq('id', linkId)
    .eq('userId', session.user.id)
    .single()

  if (!link) return NextResponse.json({ error: 'Link não encontrado' }, { status: 404 })

  const { data: updated, error } = await supabaseAdmin
    .from('Link')
    .update({ campaignId: params.id, updatedAt: new Date().toISOString() })
    .eq('id', linkId)
    .select('id, shortCode, title, originalUrl, clickCount, createdAt, isActive, utmSource, utmMedium')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ link: updated })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const campaign = await requireCampaignOwner(params.id, session.user.id)
  if (!campaign) return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 })

  const { linkId } = await req.json()
  if (!linkId) return NextResponse.json({ error: 'linkId obrigatório' }, { status: 400 })

  await supabaseAdmin
    .from('Link')
    .update({ campaignId: null, updatedAt: new Date().toISOString() })
    .eq('id', linkId)
    .eq('userId', session.user.id)
    .eq('campaignId', params.id)

  return NextResponse.json({ success: true })
}
