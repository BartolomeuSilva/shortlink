import { prisma } from '@/lib/db'
import { notFound, redirect } from 'next/navigation'

interface Props { params: Promise<{ username: string }> }

export async function generateMetadata({ params }: Props) {
  const { username } = await params
  const bio = await prisma.bioPage.findFirst({
    where: { slug: username },
    select: { title: true, bio: true },
  })
  return {
    title: bio?.title || `@${username} | 123bit`,
    description: bio?.bio || undefined,
  }
}

export default async function BioPublicPage({ params }: Props) {
  const { username } = await params

  const bio = await prisma.bioPage.findFirst({
    where: { slug: username, published: true },
    select: { slug: true },
  })

  if (!bio) notFound()

  redirect(`/b/${bio.slug}`)
}
