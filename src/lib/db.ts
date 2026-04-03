// Prisma is being deprecated in favor of Supabase SDK
// This file is kept for compatibility during migration
export const prisma = new Proxy({} as any, {
  get: (target, prop) => {
    console.error(`❌ Chamada ao Prisma detectada em: .${String(prop)}`)
    throw new Error('Prisma is disabled. Use supabaseAdmin from @/lib/supabase instead.')
  }
})
