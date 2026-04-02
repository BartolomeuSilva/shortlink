import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { itemId } = await req.json()
    if (!itemId) return NextResponse.json({ error: 'itemId required' }, { status: 400 })

    await prisma.bioPageItem.update({
      where: { id: itemId },
      data: { clicks: { increment: 1 } },
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}
