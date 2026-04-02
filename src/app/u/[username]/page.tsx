import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import BioPageClient from './BioPageClient'

interface Props { params: Promise<{ username: string }> }

export async function generateMetadata({ params }: Props) {
  const { username } = await params
  const bio = await prisma.bioPage.findUnique({
    where: { username },
    select: { title: true, bio: true },
  })
  return {
    title: bio?.title || `@${username} | 123bit`,
    description: bio?.bio || undefined,
  }
}

export default async function BioPublicPage({ params }: Props) {
  const { username } = await params

  const bio = await prisma.bioPage.findUnique({
    where: { username, published: true },
    include: {
      items: { where: { active: true }, orderBy: { order: 'asc' } },
      user: { select: { image: true, name: true } },
    },
  })

  if (!bio) notFound()

  return <BioPageClient bio={bio} />
}
