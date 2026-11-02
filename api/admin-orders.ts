// Pedidos para el panel del local (/admin). Pide la contraseña de ADMIN_PASSWORD.
import { guard } from './_lib/admin.js'
import { listOrders, listRevocations, ORDER_STATUSES, setOrderStatus, type OrderStatus } from './_lib/db.js'
import { json } from './_lib/uber.js'

export async function GET(request: Request): Promise<Response> {
  const denied = guard(request)
  if (denied) return denied
  try {
    const [orders, revocations] = await Promise.all([listOrders(), listRevocations()])
    return json({ orders, revocations })
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
