import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'
import { LinkTable } from '@/components/links/LinkTable'

async function getLinks(userId: string, page: number, search: string) {
  const limit = 20
  const skip = (page - 1) * limit

  const where: Prisma.LinkWhereInput = search
    ? {
        userId,
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { originalUrl: { contains: search, mode: 'insensitive' } },
          { shortCode: { contains: search, mode: 'insensitive' } },
        ],
      }
    : { userId }

  const [links, total] = await Promise.all([
    prisma.link.findMany({
      where,
      include: {
        tags: true,
        _count: { select: { clicks: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.link.count({ where }),
  ])

  return {
    links: links.map((l) => ({
      id: l.id,
      shortCode: l.shortCode,
      originalUrl: l.originalUrl,
      title: l.title,
      isActive: l.isActive,
      clickCount: l._count.clicks,
      expiresAt: l.expiresAt?.toISOString() || null,
      createdAt: l.createdAt.toISOString(),
      tags: l.tags.map((t) => ({ id: t.id, name: t.name, color: t.color })),
    })),
    total,
    page,
    pageSize: limit,
  }
}

export default async function LinksPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) return null

  const params = await searchParams
  const page = parseInt(params.page || '1')
  const search = params.search || ''

  const data = await getLinks(session.user.id, page, search)

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 500, color: 'var(--text-primary)', letterSpacing: '-0.4px' }}>Meus Links</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginTop: '4px' }}>Gerencie seus links curtos</p>
      </div>
      <LinkTable {...data} />
    </div>
  )
}
