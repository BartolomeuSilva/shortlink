import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const schema = z.object({
  iosAppId:        z.string().max(100).optional().or(z.literal('')),
  androidPackage:  z.string().max(200).optional().or(z.literal('')),
  iosStoreUrl:     z.string().url().optional().or(z.literal('')),
  androidStoreUrl: z.string().url().optional().or(z.literal('')),
})

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const domain = await prisma.domain.findFirst({
    where: { id: params.id, userId: session.user.id },
    include: { deepLinkConfig: true },
  })
  if (!domain) return NextResponse.json({ error: 'Domínio não encontrado' }, { status: 404 })

  return NextResponse.json({ deepLinkConfig: domain.deepLinkConfig })
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const domain = await prisma.domain.findFirst({
    where: { id: params.id, userId: session.user.id },
  })
  if (!domain) return NextResponse.json({ error: 'Domínio não encontrado' }, { status: 404 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

  const data = {
    iosAppId:        parsed.data.iosAppId        || null,
    androidPackage:  parsed.data.androidPackage  || null,
    iosStoreUrl:     parsed.data.iosStoreUrl     || null,
    androidStoreUrl: parsed.data.androidStoreUrl || null,
  }

  const config = await prisma.deepLinkConfig.upsert({
    where: { domainId: params.id },
    create: { domainId: params.id, ...data },
    update: data,
  })

  return NextResponse.json({ deepLinkConfig: config })
}
