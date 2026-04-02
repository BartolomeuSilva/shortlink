import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { getBaseUrl } from '@/lib/utils'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const campaign = await prisma.campaign.findFirst({
    where: { id: params.id, userId: session.user.id },
    include: {
      links: {
        select: {
          id: true, shortCode: true, title: true, originalUrl: true,
          clickCount: true, createdAt: true, isActive: true,
          utmSource: true, utmMedium: true, utmCampaign: true,
        },
        orderBy: { clickCount: 'desc' },
      },
    },
  })

  if (!campaign) return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 })

  const totalClicks = campaign.links.reduce((s, l) => s + l.clickCount, 0)
  const base = getBaseUrl()

  return NextResponse.json({
    campaign: {
      ...campaign,
      totalClicks,
      links: campaign.links.map(l => ({ ...l, shortUrl: `${base}/${l.shortCode}` })),
    },
  })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const campaign = await prisma.campaign.findFirst({ where: { id: params.id, userId: session.user.id } })
  if (!campaign) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  const body = await req.json()
  const schema = z.object({ name: z.string().min(1).max(100).optional(), description: z.string().max(500).optional() })
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

  const updated = await prisma.campaign.update({ where: { id: params.id }, data: parsed.data })
  return NextResponse.json({ campaign: updated })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const campaign = await prisma.campaign.findFirst({ where: { id: params.id, userId: session.user.id } })
  if (!campaign) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  // Unlink all associated links before deleting
  await prisma.link.updateMany({ where: { campaignId: params.id }, data: { campaignId: null } })
  await prisma.campaign.delete({ where: { id: params.id } })

  return NextResponse.json({ success: true })
}
