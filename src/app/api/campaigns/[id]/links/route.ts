import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// POST   — add a link to the campaign    { linkId }
// DELETE — remove a link from campaign   { linkId }

async function requireCampaignOwner(campaignId: string, userId: string) {
  return prisma.campaign.findFirst({ where: { id: campaignId, userId } })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const campaign = await requireCampaignOwner(params.id, session.user.id)
  if (!campaign) return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 })

  const { linkId } = await req.json()
  if (!linkId) return NextResponse.json({ error: 'linkId obrigatório' }, { status: 400 })

  // Make sure the link belongs to this user
  const link = await prisma.link.findFirst({
    where: { id: linkId, userId: session.user.id },
  })
  if (!link) return NextResponse.json({ error: 'Link não encontrado' }, { status: 404 })

  const updated = await prisma.link.update({
    where: { id: linkId },
    data: { campaignId: params.id },
    select: {
      id: true, shortCode: true, title: true, originalUrl: true,
      clickCount: true, createdAt: true, isActive: true,
      utmSource: true, utmMedium: true,
    },
  })

  return NextResponse.json({ link: updated })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const campaign = await requireCampaignOwner(params.id, session.user.id)
  if (!campaign) return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 })

  const { linkId } = await req.json()
  if (!linkId) return NextResponse.json({ error: 'linkId obrigatório' }, { status: 400 })

  await prisma.link.updateMany({
    where: { id: linkId, userId: session.user.id, campaignId: params.id },
    data: { campaignId: null },
  })

  return NextResponse.json({ success: true })
}
