import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { generateSecret, generateURI, verify } from 'otplib'
import { nanoid } from 'nanoid'

export async function GET() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { data: user, error } = await supabaseAdmin
      .from('User')
      .select('twoFactorEnabled, twoFactorSecret, email')
      .eq('id', userId)
      .single()

    if (error || !user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (user.twoFactorEnabled) {
      return NextResponse.json({ enabled: true })
    }

    const secret = user.twoFactorSecret || generateSecret()

    if (!user.twoFactorSecret) {
      await supabaseAdmin
        .from('User')
        .update({ twoFactorSecret: secret, updatedAt: new Date().toISOString() })
        .eq('id', userId)
    }

    const otpAuthUrl = generateURI({ label: user.email || userId, secret, issuer: '123bit' })

    return NextResponse.json({ enabled: false, otpAuthUrl, secret })
  } catch (err: any) {
    console.error('❌ Erro ao buscar 2FA:', err)
    return NextResponse.json({ error: 'Erro ao carregar configurações de segurança' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { token } = await req.json()
    if (!token) return NextResponse.json({ error: 'Token obrigatório' }, { status: 400 })

    const { data: user } = await supabaseAdmin
      .from('User')
      .select('twoFactorSecret, twoFactorEnabled')
      .eq('id', userId)
      .single()

    if (!user?.twoFactorSecret) return NextResponse.json({ error: 'Configuração não iniciada' }, { status: 400 })
    if (user.twoFactorEnabled) return NextResponse.json({ error: '2FA já habilitado' }, { status: 400 })

    const result = await verify({ token, secret: user.twoFactorSecret })
    if (!result) return NextResponse.json({ error: 'Código inválido ou expirado' }, { status: 400 })

    const backupCodes = Array.from({ length: 8 }, () => nanoid(10).toUpperCase())
    const bcrypt = await import('bcryptjs')
    const hashedCodes = await Promise.all(backupCodes.map(c => bcrypt.hash(c, 10)))

    // Atualizar usuário
    await supabaseAdmin
      .from('User')
      .update({ twoFactorEnabled: true, updatedAt: new Date().toISOString() })
      .eq('id', userId)

    // Limpar códigos antigos
    await supabaseAdmin
      .from('BackupCode')
      .delete()
      .eq('userId', userId)

    // Inserir novos códigos
    const now = new Date().toISOString()
    await supabaseAdmin
      .from('BackupCode')
      .insert(hashedCodes.map(code => ({
        id: nanoid(),
        userId,
        code,
        createdAt: now
      })))

    return NextResponse.json({ success: true, backupCodes })
  } catch (err: any) {
    console.error('❌ Erro ao habilitar 2FA:', err)
    return NextResponse.json({ error: 'Erro ao configurar 2FA' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { token } = await req.json()

    const { data: user } = await supabaseAdmin
      .from('User')
      .select('twoFactorSecret, twoFactorEnabled')
      .eq('id', userId)
      .single()

    if (!user?.twoFactorEnabled) return NextResponse.json({ error: '2FA não habilitado' }, { status: 400 })

    const result = user.twoFactorSecret
      ? await verify({ token, secret: user.twoFactorSecret })
      : false
    if (!result) return NextResponse.json({ error: 'Código inválido' }, { status: 400 })

    // Desabilitar 2FA
    await supabaseAdmin
      .from('User')
      .update({ twoFactorEnabled: false, twoFactorSecret: null, updatedAt: new Date().toISOString() })
      .eq('id', userId)

    // Limpar códigos
    await supabaseAdmin
      .from('BackupCode')
      .delete()
      .eq('userId', userId)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('❌ Erro ao desabilitar 2FA:', err)
    return NextResponse.json({ error: 'Erro ao desabilitar 2FA' }, { status: 500 })
  }
}
