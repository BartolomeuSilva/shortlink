import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'O arquivo deve ser uma imagem' }, { status: 400 })
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'A imagem deve ter no máximo 5MB' }, { status: 400 })
    }

    const ext = file.type.split('/')[1].replace('jpeg', 'jpg')
    const filename = `${session.user.id}.${ext}`
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'avatars')

    await mkdir(uploadsDir, { recursive: true })
    await writeFile(path.join(uploadsDir, filename), Buffer.from(await file.arrayBuffer()))

    const imageUrl = `/uploads/avatars/${filename}`

    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: imageUrl },
    })

    return NextResponse.json({ imageUrl })
  } catch (error) {
    console.error('Avatar upload error:', error)
    return NextResponse.json({ error: 'Erro ao salvar foto' }, { status: 500 })
  }
}
