import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redisSet } from '@/lib/redis'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    const link = await prisma.link.findUnique({
      where: { id: params.id },
    })

    if (!link || link.userId !== session.user.id) {
      return NextResponse.json({ error: 'Link não encontrado' }, { status: 404 })
    }

    const updated = await prisma.link.update({
      where: { id: params.id },
      data: {
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.title !== undefined && { title: body.title }),
        ...(body.originalUrl !== undefined && { originalUrl: body.originalUrl }),
        ...(body.campaignId !== undefined && { campaignId: body.campaignId || null }),
      },
      include: { tags: true },
    })

    await redisSet(`link:${updated.shortCode}`, JSON.stringify({
      id: updated.id,
      originalUrl: updated.originalUrl,
      passwordRequired: updated.passwordRequired,
      password: updated.password,
      expiresAt: updated.expiresAt?.toISOString() || null,
      isActive: updated.isActive,
    }), 3600)

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Update link error:', error)
    return NextResponse.json({ error: 'Erro ao atualizar link' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const link = await prisma.link.findUnique({
      where: { id: params.id },
    })

    if (!link || link.userId !== session.user.id) {
      return NextResponse.json({ error: 'Link não encontrado' }, { status: 404 })
    }

    await prisma.link.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete link error:', error)
    return NextResponse.json({ error: 'Erro ao excluir link' }, { status: 500 })
  }
}
