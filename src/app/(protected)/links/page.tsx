import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { LinkTable } from '@/components/links/LinkTable'
import { PageHeader } from '@/components/layout/PageHeader'

async function getLinks(userId: string, page: number, search: string, workspaceId?: string) {
  const limit = 20
  const skip = (page - 1) * limit

  let query = supabaseAdmin
    .from('Link')
    .select('*, qrConfig:QRConfig(id)', { count: 'exact' })

  if (workspaceId) {
    query = query.eq('workspaceId', workspaceId)
  } else {
    query = query.eq('userId', userId).is('workspaceId', null)
  }

  if (search) {
    query = query.or(`title.ilike.%${search}%,originalUrl.ilike.%${search}%,shortCode.ilike.%${search}%`)
  }

  const { data: links, count: total, error } = await query
    .order('createdAt', { ascending: false })
    .range(skip, skip + limit - 1)

  if (error) {
    console.error('Fetch links error:', error)
    return { links: [], total: 0, page, pageSize: limit }
  }

  return {
    links: links?.map((l: any) => ({
      id: l.id,
      shortCode: l.shortCode,
      originalUrl: l.originalUrl,
      title: l.title,
      isActive: l.isActive,
      clickCount: l.clickCount || 0,
      hasQr: !!l.qrConfig && (Array.isArray(l.qrConfig) ? l.qrConfig.length > 0 : true),
      expiresAt: l.expiresAt ? new Date(l.expiresAt).toISOString() : null,
      createdAt: new Date(l.createdAt).toISOString(),
      tags: [], // Tags desativadas por enquanto devido ao erro PGRST200
    })) || [],
    total: total || 0,
    page,
    pageSize: limit,
  }
}

export default async function LinksPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; workspaceId?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) return null

  const params = await searchParams
  const page = parseInt(params.page || '1')
  const search = params.search || ''
  const workspaceId = params.workspaceId

  const data = await getLinks(session.user.id, page, search, workspaceId)

  return (
    <>
      <PageHeader title="Meus Links" subtitle="Gerencie seus links curtos" />
      <LinkTable {...data} />
    </>
  )
}
