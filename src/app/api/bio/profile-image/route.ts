import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

const BUCKET = 'avatars'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const { searchParams } = new URL(request.url)
    const bioId = searchParams.get('bioId')

    if (!file) return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
    if (!file.type.startsWith('image/')) return NextResponse.json({ error: 'O arquivo deve ser uma imagem' }, { status: 400 })
    if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: 'A imagem deve ter no máximo 5MB' }, { status: 400 })

    const ext = file.type.split('/')[1].replace('jpeg', 'jpg')
    const filePath = `bio-${bioId || session.user.id}.${ext}`
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

    const urlWithCache = publicUrl + '?t=' + Date.now()

    // Auto-save the image URL to the BioPage if bioId is provided
    if (bioId) {
      const { error: dbError } = await supabaseAdmin
        .from('BioPage')
        .update({ profileImage: urlWithCache })
        .eq('id', bioId)
        .eq('userId', session.user.id)

      if (dbError) {
        console.error('DB update error:', dbError)
      } else {
        console.log('✅ BioPage profileImage saved:', urlWithCache)
      }
    }

    return NextResponse.json({ imageUrl: urlWithCache })
  } catch (error) {
    console.error('Bio profile image upload error:', error)
    return NextResponse.json({ error: 'Erro ao salvar imagem' }, { status: 500 })
  }
}
