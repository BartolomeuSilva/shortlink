import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET  /api/links/health — list health status of all user's links
// POST /api/links/health — trigger a health check for a specific link (body: { linkId })

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const links = await prisma.link.findMany({
    where: { userId: session.user.id, isActive: true },
    select: {
      id: true,
      shortCode: true,
      title: true,
      originalUrl: true,
      healthStatus: true,
      lastHealthCheck: true,
      clickCount: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return NextResponse.json({ links })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { linkId } = await req.json()

  const link = await prisma.link.findFirst({
    where: { id: linkId, userId: session.user.id },
    select: { id: true, originalUrl: true },
  })

  if (!link) return NextResponse.json({ error: 'Link não encontrado' }, { status: 404 })

  const result = await checkUrl(link.originalUrl)

  await prisma.link.update({
    where: { id: link.id },
    data: { healthStatus: result.status, lastHealthCheck: new Date() },
  })

  return NextResponse.json(result)
}

// Bulk check — called from a cron or manual trigger
export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Only check links not checked in the last 6 hours
  const cutoff = new Date(Date.now() - 6 * 60 * 60 * 1000)

  const links = await prisma.link.findMany({
    where: {
      userId: session.user.id,
      isActive: true,
      OR: [{ lastHealthCheck: null }, { lastHealthCheck: { lt: cutoff } }],
    },
    select: { id: true, originalUrl: true },
    take: 20,
  })

  const results = await Promise.allSettled(
    links.map(async (link) => {
      const result = await checkUrl(link.originalUrl)
      await prisma.link.update({
        where: { id: link.id },
        data: { healthStatus: result.status, lastHealthCheck: new Date() },
      })
      return { id: link.id, ...result }
    })
  )

  const checked = results
    .filter((r): r is PromiseFulfilledResult<{ id: string; status: string; statusCode?: number }> => r.status === 'fulfilled')
    .map(r => r.value)

  return NextResponse.json({ checked: checked.length, results: checked })
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
