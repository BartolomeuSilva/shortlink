import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = params

  try {
    const domain = await prisma.domain.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!domain) {
      return NextResponse.json({ error: 'Domínio não encontrado' }, { status: 404 })
    }

    await prisma.domain.delete({ where: { id } })

    return NextResponse.json({ message: 'Domínio removido' })
  } catch (error) {
    console.error('Delete domain error:', error)
    return NextResponse.json({ error: 'Erro ao remover domínio' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = params
  const { verified } = await request.json()

  try {
    const domain = await prisma.domain.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!domain) {
      return NextResponse.json({ error: 'Domínio não encontrado' }, { status: 404 })
    }

    const updated = await prisma.domain.update({
      where: { id },
      data: { verified },
    })

    return NextResponse.json({ domain: updated })
  } catch (error) {
    console.error('Update domain error:', error)
    return NextResponse.json({ error: 'Erro ao atualizar domínio' }, { status: 500 })
  }
}
