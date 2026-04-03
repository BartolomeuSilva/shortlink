import { supabaseAdmin } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import BioPageClient from './BioPageClient'

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const { data: bio } = await supabaseAdmin
    .from('BioPage')
    .select('title, bio')
    .eq('slug', slug)
    .maybeSingle()

  return {
    title: bio?.title || `@${slug} | 123bit`,
    description: bio?.bio || undefined,
  }
}

export default async function BioPublicPage({ params }: Props) {
  const { slug } = await params

  const { data: bio } = await supabaseAdmin
    .from('BioPage')
    .select('*, items:BioPageItem(*)')
    .eq('slug', slug)
    .eq('published', true)
    .eq('items.active', true)
    .order('order', { foreignTable: 'items', ascending: true })
    .maybeSingle()

  if (!bio) notFound()

  return <BioPageClient bio={{
    slug: bio.slug,
    title: bio.title,
    bio: bio.bio,
    theme: bio.theme,
    accentColor: bio.accentColor,
    items: bio.items.map((item: any) => ({
      id: item.id,
      label: item.label,
      url: item.url,
      icon: item.icon,
      clicks: item.clicks,
    })),
  }} />
}
