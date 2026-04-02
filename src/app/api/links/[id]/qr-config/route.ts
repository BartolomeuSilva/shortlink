import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const schema = z.object({
  fgColor:     z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().default('#000000'),
  bgColor:     z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().default('#FFFFFF'),
  cornerStyle: z.enum(['square', 'rounded']).optional().default('square'),
  errorLevel:  z.enum(['L', 'M', 'Q', 'H']).optional().default('M'),
  frameText:   z.string().max(40).optional(),
  logoUrl:     z.string().url().optional().or(z.literal('')),
})

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const link = await prisma.link.findFirst({
    where: { id: params.id, userId: session.user.id },
    include: { qrConfig: true },
  })
  if (!link) return NextResponse.json({ error: 'Link não encontrado' }, { status: 404 })

  return NextResponse.json({ qrConfig: link.qrConfig })
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const link = await prisma.link.findFirst({
    where: { id: params.id, userId: session.user.id },
  })
  if (!link) return NextResponse.json({ error: 'Link não encontrado' }, { status: 404 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

  const data = {
    fgColor: parsed.data.fgColor,
    bgColor: parsed.data.bgColor,
    cornerStyle: parsed.data.cornerStyle,
    errorLevel: parsed.data.errorLevel,
    frameText: parsed.data.frameText || null,
    logoUrl: parsed.data.logoUrl || null,
  }

  const qrConfig = await prisma.qRConfig.upsert({
    where: { linkId: params.id },
    create: { linkId: params.id, ...data },
    update: data,
  })

  return NextResponse.json({ qrConfig })
}
