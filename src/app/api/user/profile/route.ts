import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  image: z.string().url().optional().nullable(),
})

export async function GET(request: NextRequest) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      plan: true,
      apiKey: true,
      twoFactorEnabled: true,
      createdAt: true,
      _count: {
        select: {
          links: true,
        },
      },
    },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const planLimits = {
    FREE: { links: 50, clicksPerMonth: 1000 },
    PRO: { links: 5000, clicksPerMonth: 100000 },
    ENTERPRISE: { links: Infinity, clicksPerMonth: Infinity },
  }

  const limits = planLimits[user.plan as keyof typeof planLimits]

  return NextResponse.json({
    ...user,
    limits,
    usage: {
      links: user._count.links,
      linksPercentage: Math.min((user._count.links / limits.links) * 100, 100),
    },
  })
}

export async function PATCH(request: NextRequest) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const result = updateProfileSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      )
    }

    const { name, image } = result.data

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(name !== undefined && { name }),
        ...(image !== undefined && { image }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        plan: true,
      },
    })

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: 'Erro ao atualizar perfil' }, { status: 500 })
  }
}
