import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

const BUCKET = 'avatars'

async function ensureBucket() {
  const { data: buckets } = await supabaseAdmin.storage.listBuckets()
  const exists = buckets?.some(b => b.name === BUCKET)
  if (!exists) {
    const { error } = await supabaseAdmin.storage.createBucket(BUCKET, { public: true })
    if (error) console.error('Failed to create bucket:', error)
  }
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
    if (!file.type.startsWith('image/')) return NextResponse.json({ error: 'O arquivo deve ser uma imagem' }, { status: 400 })
    if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: 'A imagem deve ter no máximo 5MB' }, { status: 400 })

    await ensureBucket()

    const ext = file.type.split('/')[1].replace('jpeg', 'jpg')
    const filePath = `${session.user.id}.${ext}`
    const arrayBuffer = await file.arrayBuffer()

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(filePath, arrayBuffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      console.error('Supabase storage upload error:', uploadError)
      return NextResponse.json({ error: `Erro ao fazer upload: ${uploadError.message}` }, { status: 500 })
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from(BUCKET)
      .getPublicUrl(filePath)

    const { error: dbError } = await supabaseAdmin
      .from('User')
      .update({ image: publicUrl })
      .eq('id', session.user.id)

    if (dbError) {
      console.error('DB update error:', dbError)
      return NextResponse.json({ error: 'Erro ao atualizar perfil' }, { status: 500 })
    }

    return NextResponse.json({ imageUrl: publicUrl })
  } catch (error) {
    console.error('Avatar upload error:', error)
    return NextResponse.json({ error: 'Erro ao salvar foto' }, { status: 500 })
  }
}
