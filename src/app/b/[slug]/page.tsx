import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import BioPageClient from './BioPageClient'

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const bio = await prisma.bioPage.findFirst({
    where: { slug },
    select: { title: true, bio: true },
  })
  return {
    title: bio?.title || `@${slug} | 123bit`,
    description: bio?.bio || undefined,
  }
}

export default async function BioPublicPage({ params }: Props) {
  const { slug } = await params

  const bio = await prisma.bioPage.findFirst({
    where: { slug, published: true },
    include: {
      items: { where: { active: true }, orderBy: { order: 'asc' } },
    },
  })

  if (!bio) notFound()

  return <BioPageClient bio={{
    slug: bio.slug,
    title: bio.title,
    bio: bio.bio,
    theme: bio.theme,
    accentColor: bio.accentColor,
    items: bio.items.map(item => ({
      id: item.id,
      label: item.label,
      url: item.url,
      icon: item.icon,
      clicks: item.clicks,
    })),
  }} />
}
