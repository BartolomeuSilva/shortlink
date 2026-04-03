import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { z } from 'zod'
import { nanoid } from 'nanoid'

const schema = z.object({
  name: z.string().min(1).max(50),
  url: z.string().url(),
  events: z.array(z.string()).min(1),
  secret: z.string().optional(),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { data: webhooks, error } = await supabaseAdmin
      .from('Webhook')
      .select('*')
      .eq('userId', session.user.id)
      .order('createdAt', { ascending: false })

    if (error) throw error

    return NextResponse.json({ webhooks: webhooks || [] })
  } catch (err: any) {
    console.error('❌ Erro ao buscar webhooks:', err)
    return NextResponse.json({ error: 'Erro ao carregar webhooks' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

    const now = new Date().toISOString()
    const { data: webhook, error } = await supabaseAdmin
      .from('Webhook')
      .insert([
        {
          id: nanoid(),
          userId: session.user.id,
          name: parsed.data.name,
          url: parsed.data.url,
          events: parsed.data.events,
          secret: parsed.data.secret || null,
          active: true,
          createdAt: now,
          updatedAt: now
        }
      ])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ webhook }, { status: 201 })
  } catch (err: any) {
    console.error('❌ Erro ao criar webhook:', err)
    return NextResponse.json({ error: 'Erro ao criar webhook' }, { status: 500 })
  }
}
