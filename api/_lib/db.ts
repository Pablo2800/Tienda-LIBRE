// Base de datos de pedidos y productos (Postgres de Neon, creada desde Vercel > Storage).
// Vercel carga DATABASE_URL solo al conectar la base al proyecto.
// Si no hay base, la tienda usa el catálogo de src/data/products.ts y los pedidos no se guardan.
import { neon } from '@neondatabase/serverless'
import type { PaidOrder } from './mail.js'

type Query = (text: string, params?: unknown[]) => Promise<Record<string, unknown>[]>

let query: Query | null = null
let ready: Promise<void> | null = null

export const dbConfigured = () => Boolean(query || process.env.DATABASE_URL || process.env.POSTGRES_URL)

/** Solo para pruebas: reemplaza la conexión por otra base. */
export function setQueryForTests(q: Query) {
  query = q
  ready = null
}

export async function db(text: string, params: unknown[] = []) {
  if (!query) {
    const sql = neon((process.env.DATABASE_URL || process.env.POSTGRES_URL)!)
    query = (t, p) => sql.query(t, p) as Promise<Record<string, unknown>[]>
  }
  // Las tablas se crean solas la primera vez.
  const q = query
  ready ??= q(`
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
    )`)
    .then(() =>
      q(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      position INTEGER NOT NULL DEFAULT 0,
      active BOOLEAN NOT NULL DEFAULT true,
      name TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT '',
      brand TEXT NOT NULL DEFAULT '',
      indication TEXT NOT NULL DEFAULT '',
      detail TEXT NOT NULL DEFAULT '',
      sizes JSONB NOT NULL DEFAULT '[]',
      made_to_measure BOOLEAN NOT NULL DEFAULT false,
      bulky BOOLEAN NOT NULL DEFAULT false,
      price INTEGER NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0,
      kind TEXT,
      media JSONB NOT NULL DEFAULT '[]',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`),
    )
    .then(() => q(`CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY)`))
    .then(() =>
      q(`
    CREATE TABLE IF NOT EXISTS revocations (
      code TEXT PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      order_id TEXT NOT NULL DEFAULT '',
      name TEXT NOT NULL,
      contact TEXT NOT NULL,
      reason TEXT NOT NULL DEFAULT ''
    )`),
    )
    .then(() => undefined)
  try {
    await ready
  } catch (err) {
    // Si falló (por ejemplo, la base no respondía), se reintenta en el próximo pedido.
    ready = null
    throw err
  }
  return q(text, params)
}

// Al pasar a "pagado" se descuenta el stock de los productos del pedido (salvo los a medida).
// Todo en una sola consulta: si el aviso de Mercado Pago llega dos veces, solo la primera
// encuentra el pedido en "pendiente_pago", así que el stock se descuenta una sola vez.
// Devuelve el pedido solo si recién pasó a "pagado", para mandar el aviso de venta una sola vez.
export async function recordPayment(orderId: string, paymentId: string, paymentStatus: string): Promise<PaidOrder | null> {
  const [paid] = await db(
    `WITH paid AS (
       UPDATE orders SET payment_id = $2, payment_status = $3, status = 'pagado'
       WHERE id = $1 AND status = 'pendiente_pago' AND $3 = 'approved'
       RETURNING *
     ), sold AS (
       SELECT split_part(i->>'key', '::', 1) AS id, SUM((i->>'quantity')::int) AS qty
       FROM paid, jsonb_array_elements(paid.items) AS i GROUP BY 1
     ), stock AS (
       UPDATE products p SET stock = GREATEST(p.stock - sold.qty, 0), updated_at = now()
       FROM sold WHERE p.id = sold.id AND NOT p.made_to_measure
     )
     SELECT * FROM paid`,
    [orderId, paymentId, paymentStatus],
  )
  // Si no pasó a "pagado" (rechazado, pendiente o aviso repetido), igual se guarda el último estado del pago.
  await db(`UPDATE orders SET payment_id = $2, payment_status = $3 WHERE id = $1`, [orderId, paymentId, paymentStatus])
  return (paid as PaidOrder | undefined) ?? null
}

export type Revocation = { code: string; order_id: string; name: string; contact: string; reason: string }

export async function createRevocation(r: Revocation) {
  await db(`INSERT INTO revocations (code, order_id, name, contact, reason) VALUES ($1, $2, $3, $4, $5)`, [r.code, r.order_id, r.name, r.contact, r.reason])
}

export const listRevocations = (limit = 100) => db(`SELECT * FROM revocations ORDER BY created_at DESC LIMIT $1`, [limit])

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

export const listOrders = (limit = 200) => db(`SELECT * FROM orders ORDER BY created_at DESC LIMIT $1`, [limit])

export async function setOrderStatus(orderId: string, status: OrderStatus) {
  const rows = await db(`UPDATE orders SET status = $2 WHERE id = $1 RETURNING id`, [orderId, status])
  return rows.length > 0
}
