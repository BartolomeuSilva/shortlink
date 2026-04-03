import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { redisSet } from '@/lib/redis'
import { generateShortCode, isValidUrl, getBaseUrl } from '@/lib/utils'
import { nanoid } from 'nanoid'

export async function POST(request: NextRequest) {
  try {
    const { originalUrl } = await request.json()

    if (!originalUrl) {
      return NextResponse.json({ error: 'URL é obrigatória' }, { status: 400 })
    }

    if (!isValidUrl(originalUrl)) {
      return NextResponse.json({ error: 'URL inválida' }, { status: 400 })
    }

    let shortCode = generateShortCode(7)
    let attempts = 0

    while (attempts < 10) {
      const { data: exists } = await supabaseAdmin
        .from('Link')
        .select('id')
        .eq('shortCode', shortCode)
        .single()
      
      if (!exists) break
      shortCode = generateShortCode(7)
      attempts++
    }

    if (attempts >= 10) {
      return NextResponse.json({ error: 'Erro ao gerar link único' }, { status: 500 })
    }

    // Criar link no Supabase gerando os campos obrigatórios manualmente
    const now = new Date().toISOString()
    const { data: link, error: createError } = await supabaseAdmin
      .from('Link')
      .insert([
        {
          id: nanoid(),
          shortCode,
          originalUrl,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        }
      ])
      .select()
      .single()

    if (createError) {
      console.error('❌ Erro no Supabase:', {
        message: createError.message,
        details: createError.details,
        hint: createError.hint,
        code: createError.code
      })
      return NextResponse.json({ error: `Erro no banco: ${createError.message}` }, { status: 500 })
    }

    try {
      await redisSet(`link:${shortCode}`, JSON.stringify({
        id: link.id,
        originalUrl: link.originalUrl,
        passwordRequired: false,
        isActive: true,
      }), 3600)
    } catch (redisError) {
      console.error('⚠️ Redis error (non-fatal):', redisError)
    }

    return NextResponse.json({
      shortCode: link.shortCode,
      shortUrl: `${getBaseUrl()}/${link.shortCode}`,
    }, { status: 201 })
  } catch (error: any) {
    console.error('❌ Erro Crítico na API de Links:', error)
    return NextResponse.json({ error: 'Erro ao criar link. Verifique a conexão com o Supabase.' }, { status: 500 })
  }
}
