import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
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

  const { data: user, error } = await supabaseAdmin
    .from('User')
    .select('id, name, email, image, plan, apiKey, twoFactorEnabled, createdAt, links:Link(count)')
    .eq('id', session.user.id)
    .single()

  if (!user || error) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const planLimits = {
    FREE: { links: 50, clicksPerMonth: 1000 },
    PRO: { links: 5000, clicksPerMonth: 100000 },
    ENTERPRISE: { links: Infinity, clicksPerMonth: Infinity },
  }

  const userPlan = (user.plan as keyof typeof planLimits) || 'FREE'
  const limits = planLimits[userPlan]
  const linksCount = user.links?.[0]?.count || 0

  return NextResponse.json({
    ...user,
    limits,
    usage: {
      links: linksCount,
      linksPercentage: Math.min((linksCount / limits.links) * 100, 100),
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

    const now = new Date().toISOString()
    const { data: user, error: updateError } = await supabaseAdmin
      .from('User')
      .update({
        ...(name !== undefined && { name }),
        ...(image !== undefined && { image }),
        updatedAt: now,
      })
      .eq('id', session.user.id)
      .select('id, name, email, image, plan')
      .single()

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: 'Erro ao atualizar perfil' }, { status: 500 })
  }
}
