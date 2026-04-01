import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { redisGet } from '@/lib/redis'
import bcrypt from 'bcryptjs'

export async function GET(
  request: Request,
  { params }: { params: { shortCode: string } }
) {
  const { shortCode } = params

  const cacheKey = `link:${shortCode}`
  const cached = await redisGet(cacheKey)

  let link
  if (cached) {
    link = JSON.parse(cached)
  } else {
    link = await prisma.link.findUnique({
      where: { shortCode },
      select: {
        id: true,
        shortCode: true,
        originalUrl: true,
        title: true,
        passwordRequired: true,
      },
    })
  }

  if (!link) {
    return NextResponse.json({ error: 'Link not found' }, { status: 404 })
  }

  const formHtml = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🔒 Link Protegido - 123bit.app</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #F4F3F0;
      padding: 20px;
    }
    .card {
      background: #fff;
      border-radius: 16px;
      padding: 40px;
      width: 100%;
      max-width: 380px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.06);
    }
    .lock {
      width: 56px;
      height: 56px;
      background: #EEEDFE;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
      font-size: 28px;
    }
    h1 {
      font-size: 20px;
      font-weight: 500;
      text-align: center;
      margin-bottom: 8px;
      color: #1A1A18;
    }
    .subtitle {
      font-size: 14px;
      color: #5F5E5A;
      text-align: center;
      margin-bottom: 28px;
    }
    .form-group {
      margin-bottom: 16px;
    }
    label {
      display: block;
      font-size: 13px;
      font-weight: 500;
      color: #1A1A18;
      margin-bottom: 6px;
    }
    input[type="password"] {
      width: 100%;
      padding: 12px 14px;
      font-size: 15px;
      border: 1px solid #D8D7D1;
      border-radius: 10px;
      outline: none;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    input[type="password"]:focus {
      border-color: #7F77DD;
      box-shadow: 0 0 0 3px rgba(127, 119, 221, 0.15);
    }
    .btn {
      width: 100%;
      padding: 12px;
      font-size: 15px;
      font-weight: 500;
      color: #fff;
      background: #534AB7;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      transition: background 0.15s;
    }
    .btn:hover { background: #3C3489; }
    .error {
      background: #FCEBEB;
      color: #A32D2D;
      padding: 12px;
      border-radius: 8px;
      font-size: 13px;
      margin-bottom: 16px;
      display: none;
    }
    .error.show { display: block; }
  </style>
</head>
<body>
  <div class="card">
    <div class="lock">🔒</div>
    <h1>Link Protegido</h1>
    <p class="subtitle">Este link requer uma senha para acessar</p>
    <div class="error" id="error"></div>
    <form id="form">
      <div class="form-group">
        <label for="password">Senha</label>
        <input type="password" id="password" name="password" placeholder="Digite a senha" required autofocus>
      </div>
      <button type="submit" class="btn">Acessar Link</button>
    </form>
  </div>
  <script>
    const form = document.getElementById('form');
    const error = document.getElementById('error');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      error.classList.remove('show');
      error.textContent = '';

      const password = document.getElementById('password').value;

      try {
        const res = await fetch(window.location.pathname, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password })
        });

        const data = await res.json();

        if (res.ok && data.redirectUrl) {
          window.location.href = data.redirectUrl;
        } else {
          error.textContent = data.error || 'Senha incorreta';
          error.classList.add('show');
        }
      } catch {
        error.textContent = 'Erro ao verificar senha';
        error.classList.add('show');
      }
    });
  </script>
</body>
</html>`

  return new NextResponse(formHtml, {
    headers: { 'Content-Type': 'text/html' },
  })
}

export async function POST(
  request: Request,
  { params }: { params: { shortCode: string } }
) {
  const { shortCode } = params

  try {
    const { password } = await request.json()

    if (!password) {
      return NextResponse.json({ error: 'Senha requerida' }, { status: 400 })
    }

    const link = await prisma.link.findUnique({
      where: { shortCode },
      select: {
        id: true,
        password: true,
        originalUrl: true,
        isActive: true,
        expiresAt: true,
      },
    })

    if (!link) {
      return NextResponse.json({ error: 'Link não encontrado' }, { status: 404 })
    }

    if (!link.isActive) {
      return NextResponse.json({ error: 'Link desativado' }, { status: 410 })
    }

    if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'Link expirado' }, { status: 410 })
    }

    if (!link.password) {
      return NextResponse.json({ redirectUrl: link.originalUrl })
    }

    const isValid = await bcrypt.compare(password, link.password)

    if (!isValid) {
      return NextResponse.json({ error: 'Senha incorreta' }, { status: 401 })
    }

    return NextResponse.json({ redirectUrl: link.originalUrl })
  } catch (error) {
    console.error('Password verification error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
