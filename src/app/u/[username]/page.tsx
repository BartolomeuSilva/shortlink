import { supabaseAdmin } from '@/lib/supabase'
import { notFound, redirect } from 'next/navigation'

interface Props { params: Promise<{ username: string }> }

export async function generateMetadata({ params }: Props) {
  const { username } = await params
  const { data: bio } = await supabaseAdmin
    .from('BioPage')
    .select('title, bio')
    .eq('slug', username)
    .maybeSingle()

  return {
    title: bio?.title || `@${username} | 123bit`,
    description: bio?.bio || undefined,
  }
}

export default async function BioPublicPage({ params }: Props) {
  const { username } = await params

  const { data: bio } = await supabaseAdmin
    .from('BioPage')
    .select('slug')
    .eq('slug', username)
    .eq('published', true)
    .maybeSingle()

  if (!bio) notFound()

  redirect(`/b/${bio.slug}`)
}
