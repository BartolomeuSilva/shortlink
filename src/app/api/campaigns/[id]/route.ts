import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { z } from 'zod'
import { getBaseUrl } from '@/lib/utils'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: campaign, error } = await supabaseAdmin
    .from('Campaign')
    .select(`*, links:Link(id, shortCode, title, originalUrl, clickCount, createdAt, isActive, utmSource, utmMedium, utmCampaign)`)
    .eq('id', params.id)
    .eq('userId', session.user.id)
    .single()

  if (error || !campaign) return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 })

  const links = (campaign.links || []).sort((a: any, b: any) => b.clickCount - a.clickCount)
  const totalClicks = links.reduce((s: number, l: any) => s + (l.clickCount || 0), 0)
  const base = getBaseUrl()

  return NextResponse.json({
    campaign: {
      ...campaign,
      totalClicks,
      links: links.map((l: any) => ({ ...l, shortUrl: `${base}/${l.shortCode}` })),
    },
  })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: existing } = await supabaseAdmin
    .from('Campaign')
    .select('id')
    .eq('id', params.id)
    .eq('userId', session.user.id)
    .single()

  if (!existing) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  const body = await req.json()
  const schema = z.object({ name: z.string().min(1).max(100).optional(), description: z.string().max(500).optional() })
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

  const { data: campaign, error } = await supabaseAdmin
    .from('Campaign')
    .update({ ...parsed.data, updatedAt: new Date().toISOString() })
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ campaign })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: existing } = await supabaseAdmin
    .from('Campaign')
    .select('id')
    .eq('id', params.id)
    .eq('userId', session.user.id)
    .single()

  if (!existing) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  // Unlink all associated links
  await supabaseAdmin
    .from('Link')
    .update({ campaignId: null })
    .eq('campaignId', params.id)

  await supabaseAdmin.from('Campaign').delete().eq('id', params.id)

  return NextResponse.json({ success: true })
}
