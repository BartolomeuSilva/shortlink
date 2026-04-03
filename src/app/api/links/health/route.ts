import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { data: links, error } = await supabaseAdmin
      .from('Link')
      .select('id, shortCode, title, originalUrl, healthStatus, lastHealthCheck, clickCount')
      .eq('userId', userId)
      .eq('isActive', true)
      .order('createdAt', { ascending: false })
      .limit(100)

    if (error) throw error

    return NextResponse.json({ links: links || [] })
  } catch (err: any) {
    console.error('❌ Erro ao buscar saúde dos links:', err)
    return NextResponse.json({ error: 'Erro ao carregar monitoramento' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { linkId } = await req.json()

    const { data: link } = await supabaseAdmin
      .from('Link')
      .select('id, originalUrl')
      .eq('id', linkId)
      .eq('userId', userId)
      .single()

    if (!link) return NextResponse.json({ error: 'Link não encontrado' }, { status: 404 })

    const result = await checkUrl(link.originalUrl)

    await supabaseAdmin
      .from('Link')
      .update({ 
        healthStatus: result.status, 
        lastHealthCheck: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .eq('id', link.id)

    return NextResponse.json(result)
  } catch (err: any) {
    console.error('❌ Erro ao verificar link:', err)
    return NextResponse.json({ error: 'Erro ao verificar link' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const cutoff = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()

    // Buscar links que nunca foram checados ou checados há mais de 6h
    // Usando OR via filtro do Supabase
    const { data: links } = await supabaseAdmin
      .from('Link')
      .select('id, originalUrl')
      .eq('userId', userId)
      .eq('isActive', true)
      .or(`lastHealthCheck.is.null,lastHealthCheck.lt.${cutoff}`)
      .limit(20)

    if (!links) return NextResponse.json({ checked: 0, results: [] })

    const results = await Promise.allSettled(
      links.map(async (link) => {
        const result = await checkUrl(link.originalUrl)
        await supabaseAdmin
          .from('Link')
          .update({ 
            healthStatus: result.status, 
            lastHealthCheck: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })
          .eq('id', link.id)
        return { id: link.id, ...result }
      })
    )

    const checked = results
      .filter((r): r is PromiseFulfilledResult<{ id: string; status: string; statusCode?: number }> => r.status === 'fulfilled')
      .map(r => r.value)

    return NextResponse.json({ checked: checked.length, results: checked })
  } catch (err: any) {
    console.error('❌ Erro em bulk health check:', err)
    return NextResponse.json({ error: 'Erro no processamento' }, { status: 500 })
  }
}

async function checkUrl(url: string): Promise<{ status: string; statusCode?: number; latencyMs?: number }> {
  const start = Date.now()
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: AbortSignal.timeout(8000),
      headers: { 'User-Agent': '123bit-healthcheck/1.0' },
    })
    const latencyMs = Date.now() - start
    const status = res.ok ? 'ok' : 'error'
    return { status, statusCode: res.status, latencyMs }
  } catch (err: unknown) {
    const latencyMs = Date.now() - start
    const isTimeout = err instanceof Error && err.name === 'TimeoutError'
    return { status: isTimeout ? 'timeout' : 'error', latencyMs }
  }
}
