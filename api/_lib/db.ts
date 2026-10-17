// Base de datos de pedidos (Postgres de Neon, creada desde Vercel > Storage).
// Vercel carga DATABASE_URL solo al conectar la base al proyecto.
// Si no hay base, la tienda sigue funcionando pero los pedidos no se guardan.
import { neon } from '@neondatabase/serverless'

type Query = (text: string, params?: unknown[]) => Promise<Record<string, unknown>[]>

let query: Query | null = null
let ready: Promise<void> | null = null

export const dbConfigured = () => Boolean(query || process.env.DATABASE_URL || process.env.POSTGRES_URL)

/** Solo para pruebas: reemplaza la conexión por otra base. */
export function setQueryForTests(q: Query) {
  query = q
  ready = null
}

async function db(text: string, params: unknown[] = []) {
  if (!query) {
    const sql = neon((process.env.DATABASE_URL || process.env.POSTGRES_URL)!)
    query = (t, p) => sql.query(t, p) as Promise<Record<string, unknown>[]>
  }
  // La tabla se crea sola la primera vez.
  ready ??= query(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      status TEXT NOT NULL DEFAULT 'pendiente_pago',
      payment_id TEXT,
      payment_status TEXT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      ship TEXT NOT NULL,
      street TEXT NOT NULL DEFAULT '',
      zone TEXT NOT NULL DEFAULT '',
      vehicle TEXT NOT NULL DEFAULT 'moto',
      quote_id TEXT NOT NULL DEFAULT '',
      has_custom BOOLEAN NOT NULL DEFAULT false,
      items JSONB NOT NULL,
      shipping INTEGER NOT NULL DEFAULT 0,
      total INTEGER NOT NULL
    )`).then(() => undefined)
  await ready
  return query(text, params)
}

// Estados que ve el cliente en el panel, en orden.
export const ORDER_STATUSES = ['pendiente_pago', 'pagado', 'preparado', 'enviado', 'entregado', 'cancelado'] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]

export type OrderItem = { key: string; title: string; quantity: number; unit_price: number }

export type NewOrder = {
  id: string
  name: string
  phone: string
  ship: 'moto' | 'retiro'
  street: string
  zone: string
  vehicle: 'moto' | 'auto'
  quoteId: string
  hasCustom: boolean
  items: OrderItem[]
  shipping: number
  total: number
}

export async function createOrder(o: NewOrder) {
  await db(
    `INSERT INTO orders (id, name, phone, ship, street, zone, vehicle, quote_id, has_custom, items, shipping, total)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
    [o.id, o.name, o.phone, o.ship, o.street, o.zone, o.vehicle, o.quoteId, o.hasCustom, JSON.stringify(o.items), o.shipping, o.total],
  )
}

// Registra el resultado del pago. Solo pasa a "pagado" si todavía estaba esperando el pago,
// así un aviso repetido de Mercado Pago no pisa el estado que puso el local.
export async function recordPayment(orderId: string, paymentId: string, paymentStatus: string) {
  await db(
    `UPDATE orders SET payment_id = $2, payment_status = $3,
       status = CASE WHEN status = 'pendiente_pago' AND $3 = 'approved' THEN 'pagado' ELSE status END
     WHERE id = $1`,
    [orderId, paymentId, paymentStatus],
  )
}

export const listOrders = (limit = 200) => db(`SELECT * FROM orders ORDER BY created_at DESC LIMIT $1`, [limit])

export async function setOrderStatus(orderId: string, status: OrderStatus) {
  const rows = await db(`UPDATE orders SET status = $2 WHERE id = $1 RETURNING id`, [orderId, status])
  return rows.length > 0
}
