import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { authenticator } from 'otplib'
import { nanoid } from 'nanoid'

// GET  — get 2FA status + setup data (secret + QR URI)
// POST — verify token and enable 2FA
// DELETE — disable 2FA (requires current token)

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { twoFactorEnabled: true, twoFactorSecret: true, email: true },
  })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (user.twoFactorEnabled) {
    return NextResponse.json({ enabled: true })
  }

  // Generate a fresh secret for setup
  const secret = user.twoFactorSecret || authenticator.generateSecret()

  if (!user.twoFactorSecret) {
    await prisma.user.update({ where: { id: session.user.id }, data: { twoFactorSecret: secret } })
  }

  const otpAuthUrl = authenticator.keyuri(user.email || session.user.id, '123bit', secret)

  return NextResponse.json({ enabled: false, otpAuthUrl, secret })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { token } = await req.json()
  if (!token) return NextResponse.json({ error: 'Token obrigatório' }, { status: 400 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { twoFactorSecret: true, twoFactorEnabled: true },
  })
  if (!user?.twoFactorSecret) return NextResponse.json({ error: 'Configuração não iniciada' }, { status: 400 })
  if (user.twoFactorEnabled) return NextResponse.json({ error: '2FA já habilitado' }, { status: 400 })

  const isValid = authenticator.verify({ token, secret: user.twoFactorSecret })
  if (!isValid) return NextResponse.json({ error: 'Código inválido ou expirado' }, { status: 400 })

  // Generate 8 backup codes
  const backupCodes = Array.from({ length: 8 }, () => nanoid(10).toUpperCase())
  const bcrypt = await import('bcryptjs')
  const hashedCodes = await Promise.all(backupCodes.map(c => bcrypt.hash(c, 10)))

  await prisma.$transaction([
    prisma.user.update({ where: { id: session.user.id }, data: { twoFactorEnabled: true } }),
    prisma.backupCode.deleteMany({ where: { userId: session.user.id } }),
    prisma.backupCode.createMany({
      data: hashedCodes.map(code => ({ userId: session.user.id, code })),
    }),
  ])

  return NextResponse.json({ success: true, backupCodes })
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { token } = await req.json()

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { twoFactorSecret: true, twoFactorEnabled: true },
  })
  if (!user?.twoFactorEnabled) return NextResponse.json({ error: '2FA não habilitado' }, { status: 400 })

  const isValid = user.twoFactorSecret && authenticator.verify({ token, secret: user.twoFactorSecret })
  if (!isValid) return NextResponse.json({ error: 'Código inválido' }, { status: 400 })

  await prisma.$transaction([
    prisma.user.update({ where: { id: session.user.id }, data: { twoFactorEnabled: false, twoFactorSecret: null } }),
    prisma.backupCode.deleteMany({ where: { userId: session.user.id } }),
  ])

  return NextResponse.json({ success: true })
}
