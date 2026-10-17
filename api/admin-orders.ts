// Pedidos para el panel del local (/admin). Pide la contraseña de ADMIN_PASSWORD.
//
// Variables de entorno:
//   ADMIN_PASSWORD → la contraseña del panel. Sin ella, el panel queda deshabilitado.
//   DATABASE_URL   → la carga Vercel al conectar la base de Neon (Storage).
import { createHash, timingSafeEqual } from 'node:crypto'
import { dbConfigured, listOrders, ORDER_STATUSES, setOrderStatus, type OrderStatus } from './_lib/db.js'
import { json } from './_lib/uber.js'

const digest = (s: string) => createHash('sha256').update(s).digest()

// Devuelve una respuesta de error, o null si la contraseña es correcta.
function guard(request: Request): Response | null {
  const password = process.env.ADMIN_PASSWORD
  if (!password) return json({ error: 'admin_not_configured' }, 503)
  if (!dbConfigured()) return json({ error: 'db_not_configured' }, 503)
  const given = (request.headers.get('authorization') ?? '').replace(/^Bearer /, '')
  // Se comparan los hashes para que el tiempo de respuesta no revele la contraseña.
  if (!timingSafeEqual(digest(given), digest(password))) return json({ error: 'unauthorized' }, 401)
  return null
}

export async function GET(request: Request): Promise<Response> {
  const denied = guard(request)
  if (denied) return denied
  try {
    return json({ orders: await listOrders() })
  } catch (err) {
    console.error('list orders failed', err)
    return json({ error: 'db' }, 502)
  }
}

export async function PATCH(request: Request): Promise<Response> {
  const denied = guard(request)
  if (denied) return denied
  const { id, status } = ((await request.json().catch(() => ({}))) ?? {}) as { id?: string; status?: string }
  if (!id || !ORDER_STATUSES.includes(status as OrderStatus)) return json({ error: 'invalid' }, 400)
  try {
    return (await setOrderStatus(id, status as OrderStatus)) ? json({ ok: true }) : json({ error: 'not_found' }, 404)
  } catch (err) {
    console.error('update order failed', err)
    return json({ error: 'db' }, 502)
  }
}
