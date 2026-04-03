import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { customAlphabet, nanoid } from 'nanoid'

const generateApiKey = customAlphabet(
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  32
)

const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').optional(),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = registerSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      )
    }

    const { name, email, password } = result.data

    // 1. Verificar se usuário já existe via Supabase
    const { data: existingUser } = await supabaseAdmin
      .from('User')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'Este email já está cadastrado' },
        { status: 409 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    const now = new Date().toISOString()

    // 2. Criar usuário no Supabase gerando os campos obrigatórios manualmente
    const { data: user, error: createError } = await supabaseAdmin
      .from('User')
      .insert([
        {
          id: nanoid(),
          name,
          email,
          password: hashedPassword,
          plan: 'FREE',
          apiKey: generateApiKey(),
          createdAt: now,
          updatedAt: now,
        }
      ])
      .select('id, name, email, plan, createdAt')
      .single()

    if (createError) {
      console.error('❌ Supabase Insertion Error:', createError)
      throw new Error(createError.message)
    }

    return NextResponse.json({ user }, { status: 201 })
  } catch (error: any) {
    console.error('❌ Erro Crítico no Registro:', error)
    return NextResponse.json(
      { error: 'Erro ao criar conta. Verifique a conexão com o Supabase.' },
      { status: 500 }
    )
  }
}
