import { next } from '@vercel/functions'

/**
 * Control de acceso de RecipeMaker (Vercel Routing Middleware).
 *
 * Se ejecuta en el servidor de Vercel antes de servir cualquier fichero de la app: sin una sesión
 * válida no se entrega ni el HTML ni el JavaScript, solo la pantalla de login.
 *
 * Configuración (Vercel → Project → Settings → Environment Variables):
 *   APP_USERS    Usuarios permitidos, "nombre:contraseña" separados por comas.
 *                Ej.: "Alex:una-frase-larga,María:otra-frase-larga". La contraseña no puede
 *                contener comas; el nombre es el que aparece en la lista de la compra.
 *   AUTH_SECRET  Cadena aleatoria de 32+ caracteres para firmar las sesiones
 *                (p.ej. `openssl rand -base64 48`). Cambiarla cierra la sesión de todos.
 *
 * Para dar o quitar acceso: editar APP_USERS y volver a desplegar. Las sesiones de un usuario
 * eliminado dejan de ser válidas en la siguiente petición, aunque su cookie no haya caducado.
 * Si falta la configuración la app queda cerrada (fail-closed), nunca abierta.
 */

export const config = {
  // Todo pasa por aquí salvo lo que el navegador pide sin cookies (manifest e icono de la PWA).
  matcher: ['/((?!favicon\\.svg|manifest\\.webmanifest|robots\\.txt).*)'],
}

const SESSION_COOKIE = 'rm_session'
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30
const FAILED_LOGIN_DELAY_MS = 800

const encoder = new TextEncoder()

interface AuthConfig {
  users: Map<string, string>
  secret: string
}

function readConfig(): AuthConfig | null {
  const rawUsers = process.env.APP_USERS ?? ''
  const secret = process.env.AUTH_SECRET ?? ''
  const users = new Map<string, string>()
  for (const entry of rawUsers.split(',')) {
    const separator = entry.indexOf(':')
    if (separator <= 0) continue
    const name = entry.slice(0, separator).trim()
    const password = entry.slice(separator + 1).trim()
    if (name && password) users.set(name, password)
  }
  if (users.size === 0 || secret.length < 32) return null
  return { users, secret }
}

function base64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlDecode(value: string): string {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (value.length % 4)) % 4)
  const binary = atob(padded)
  return new TextDecoder().decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)))
}

async function hmac(secret: string, data: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(data)))
}

/** Comparación en tiempo constante (compara HMACs para no filtrar longitudes ni prefijos). */
async function safeEqual(secret: string, a: string, b: string): Promise<boolean> {
  const [ha, hb] = await Promise.all([hmac(secret, a), hmac(secret, b)])
  let diff = 0
  for (let i = 0; i < ha.length; i++) diff |= ha[i] ^ hb[i]
  return diff === 0
}

async function createSessionToken(user: string, secret: string): Promise<string> {
  const payload = `${base64Url(encoder.encode(user))}.${Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS}`
  return `${payload}.${base64Url(await hmac(secret, payload))}`
}

/** Devuelve el usuario de la sesión si la firma es válida, no ha caducado y el usuario sigue autorizado. */
async function readSession(request: Request, config: AuthConfig): Promise<string | null> {
  const token = parseCookies(request.headers.get('cookie'))[SESSION_COOKIE]
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [encodedUser, expires, signature] = parts
  const payload = `${encodedUser}.${expires}`
  if (!(await safeEqual(config.secret, signature, base64Url(await hmac(config.secret, payload))))) return null
  if (!/^\d+$/.test(expires) || Number(expires) < Date.now() / 1000) return null
  try {
    const user = base64UrlDecode(encodedUser)
    return config.users.has(user) ? user : null
  } catch {
    return null
  }
}

function parseCookies(header: string | null): Record<string, string> {
  const cookies: Record<string, string> = {}
  for (const part of (header ?? '').split(';')) {
    const separator = part.indexOf('=')
    if (separator < 0) continue
    cookies[part.slice(0, separator).trim()] = part.slice(separator + 1).trim()
  }
  return cookies
}

/** Solo rutas internas de la app como destino tras el login (evita redirecciones abiertas). */
function safeNextPath(value: string | null): string {
  if (!value || !value.startsWith('/')) return '/'
  // Resolver contra un origen ficticio neutraliza trucos como "//evil.com", "/\evil.com" o tabuladores.
  const resolved = new URL(value, 'https://recipemaker.invalid')
  if (resolved.origin !== 'https://recipemaker.invalid' || resolved.pathname.startsWith('/auth/')) return '/'
  return resolved.pathname + resolved.search
}

function redirect(location: string, extraHeaders: Record<string, string> = {}): Response {
  return new Response(null, { status: 303, headers: { Location: location, 'Cache-Control': 'no-store', ...extraHeaders } })
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`)
}

function loginPage(nextPath: string, error?: string, status = 200): Response {
  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<title>RecipeMaker · Acceso</title>
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<style>
  :root { color-scheme: light dark; --bg:#f2f2f7; --card:#fff; --text:#18181b; --muted:#71717a; --ring:rgba(0,0,0,.08); --brand:#1fae44; --error:#dc2626; }
  @media (prefers-color-scheme: dark) { :root { --bg:#000; --card:#18181b; --text:#f4f4f5; --muted:#a1a1aa; --ring:rgba(255,255,255,.1); --error:#f87171; } }
  * { box-sizing: border-box; }
  body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center; padding:16px; background:var(--bg); color:var(--text); font:15px/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  main { width:100%; max-width:360px; }
  h1 { font-size:28px; letter-spacing:-.02em; margin:0 0 4px; }
  p { margin:0 0 20px; color:var(--muted); }
  form { background:var(--card); border-radius:16px; padding:16px; box-shadow:0 1px 2px rgba(0,0,0,.04); }
  label { display:block; font-size:13px; font-weight:600; text-transform:uppercase; letter-spacing:.03em; color:var(--muted); margin:0 0 6px 4px; }
  input { width:100%; font:inherit; color:inherit; background:transparent; border:0; border-radius:12px; padding:10px 14px; box-shadow:inset 0 0 0 1px var(--ring); margin-bottom:14px; outline:none; }
  input:focus { box-shadow:inset 0 0 0 2px var(--brand); }
  button { width:100%; font:inherit; font-weight:600; font-size:16px; color:#fff; background:var(--brand); border:0; border-radius:14px; padding:13px; cursor:pointer; }
  .error { color:var(--error); font-size:14px; margin:0 0 14px 4px; }
</style>
</head>
<body>
<main>
  <h1>RecipeMaker</h1>
  <p>Acceso privado. Entra con tu usuario.</p>
  <form method="post" action="/auth/login">
    <input type="hidden" name="next" value="${escapeHtml(nextPath)}">
    <label for="user">Usuario</label>
    <input id="user" name="user" autocomplete="username" autocapitalize="none" required autofocus>
    <label for="password">Contraseña</label>
    <input id="password" name="password" type="password" autocomplete="current-password" required>
    ${error ? `<div class="error" role="alert">${escapeHtml(error)}</div>` : ''}
    <button type="submit">Entrar</button>
  </form>
</main>
</body>
</html>`
  return new Response(html, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Frame-Options': 'DENY',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  })
}

function sessionCookie(value: string, maxAge: number): string {
  return `${SESSION_COOKIE}=${value}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`
}

async function handleLogin(request: Request, config: AuthConfig): Promise<Response> {
  const url = new URL(request.url)
  if (request.method !== 'POST') {
    // Si ya hay sesión, no tiene sentido volver a pedir credenciales.
    if (await readSession(request, config)) return redirect(safeNextPath(url.searchParams.get('next')))
    return loginPage(safeNextPath(url.searchParams.get('next')))
  }

  const form = await request.formData()
  const user = String(form.get('user') ?? '').trim()
  const password = String(form.get('password') ?? '')
  const nextPath = safeNextPath(String(form.get('next') ?? '/'))

  // Coincidencia de usuario sin distinguir mayúsculas; se guarda el nombre tal y como está configurado.
  const configuredName = [...config.users.keys()].find((name) => name.toLowerCase() === user.toLowerCase())
  const expected = configuredName ? config.users.get(configuredName)! : ''
  // Se compara siempre (aunque el usuario no exista) para no revelar qué usuarios son válidos por tiempo de respuesta.
  const passwordOk = await safeEqual(config.secret, password, expected)

  if (!configuredName || !passwordOk) {
    await new Promise((resolve) => setTimeout(resolve, FAILED_LOGIN_DELAY_MS))
    return loginPage(nextPath, 'Usuario o contraseña incorrectos.', 401)
  }

  const token = await createSessionToken(configuredName, config.secret)
  return redirect(nextPath, { 'Set-Cookie': sessionCookie(token, SESSION_TTL_SECONDS) })
}

export default async function middleware(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const config = readConfig()

  if (!config) {
    return new Response(
      'RecipeMaker: acceso no configurado. Define APP_USERS y AUTH_SECRET (32+ caracteres) en las variables de entorno de Vercel y vuelve a desplegar.',
      { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } },
    )
  }

  switch (url.pathname) {
    case '/auth/login':
      return handleLogin(request, config)
    case '/auth/logout':
      return redirect('/auth/login', { 'Set-Cookie': sessionCookie('', 0) })
    case '/auth/me': {
      const user = await readSession(request, config)
      return new Response(JSON.stringify(user ? { user } : { error: 'unauthorized' }), {
        status: user ? 200 : 401,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      })
    }
  }

  if (await readSession(request, config)) return next()

  const wantsPage = request.method === 'GET' && (request.headers.get('accept') ?? '').includes('text/html')
  if (wantsPage) return redirect(`/auth/login?next=${encodeURIComponent(url.pathname + url.search)}`)
  return new Response('Unauthorized', { status: 401, headers: { 'Cache-Control': 'no-store' } })
}
