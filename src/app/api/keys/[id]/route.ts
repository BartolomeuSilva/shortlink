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

  try {
    const apiKey = await prisma.apiKey.findUnique({
      where: { id: params.id },
    })

    if (!apiKey || apiKey.userId !== session.user.id) {
      return NextResponse.json({ error: 'API key não encontrada' }, { status: 404 })
    }

    await prisma.apiKey.update({
      where: { id: params.id },
      data: { revokedAt: new Date() },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API key deletion error:', error)
    return NextResponse.json({ error: 'Erro ao deletar API key' }, { status: 500 })
  }
}
