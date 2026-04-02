import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const schema = z.object({
  metaPixelId:    z.string().max(30).optional().or(z.literal('')),
  googleTagId:    z.string().max(30).optional().or(z.literal('')),
  tiktokPixelId:  z.string().max(30).optional().or(z.literal('')),
  linkedinTagId:  z.string().max(20).optional().or(z.literal('')),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { metaPixelId: true, googleTagId: true, tiktokPixelId: true, linkedinTagId: true },
  })

  return NextResponse.json({ pixels: user })
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      metaPixelId:   parsed.data.metaPixelId   || null,
      googleTagId:   parsed.data.googleTagId   || null,
      tiktokPixelId: parsed.data.tiktokPixelId || null,
      linkedinTagId: parsed.data.linkedinTagId || null,
    },
    select: { metaPixelId: true, googleTagId: true, tiktokPixelId: true, linkedinTagId: true },
  })

  return NextResponse.json({ pixels: user })
}
