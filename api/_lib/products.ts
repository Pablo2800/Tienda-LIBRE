// Catálogo de productos en la base. Lo edita el local desde /admin.
// La primera vez se copia el catálogo de src/data/products.ts para no arrancar vacío.
import { SEED_PRODUCTS, type Media, type Product, type ProductKind } from '../../src/data/products.js'
import { db, dbConfigured } from './db.js'

export type AdminProduct = Product & { active: boolean }

const KINDS: ProductKind[] = ['splint', 'stocking', 'toiletRiser', 'commode', 'afo', 'insole', 'walker', 'crutch', 'wheelchair', 'lumbar', 'knee', 'collar']

let seeded: Promise<void> | null = null

// Copia el catálogo inicial una sola vez en la vida de la base. La marca en "meta" evita
// que vuelva a aparecer si el local borra todos los productos.
function seed() {
  seeded ??= (async () => {
    const first = await db(`INSERT INTO meta (key) VALUES ('catalog_seeded') ON CONFLICT DO NOTHING RETURNING key`)
    if (!first.length) return
    for (const [i, p] of SEED_PRODUCTS.entries()) await save({ ...p, active: true }, i)
  })().catch((err) => {
    seeded = null
    throw err
  })
  return seeded
}

function fromRow(r: Record<string, unknown>): AdminProduct {
  return {
    id: String(r.id),
    active: Boolean(r.active),
    name: String(r.name),
    category: String(r.category),
    brand: String(r.brand),
    indication: String(r.indication),
    detail: String(r.detail),
    sizes: (r.sizes as string[]).length ? (r.sizes as string[]) : undefined,
    madeToMeasure: Boolean(r.made_to_measure),
    bulky: Boolean(r.bulky),
    price: Number(r.price),
    stock: Number(r.stock),
    kind: (r.kind as ProductKind | null) ?? undefined,
    media: (r.media as Media[]).length ? (r.media as Media[]) : undefined,
  }
}

/** Productos para la tienda (solo los visibles), o para el panel (todos). */
export async function listProducts({ includeHidden = false } = {}): Promise<AdminProduct[]> {
  if (!dbConfigured()) return SEED_PRODUCTS.map((p) => ({ ...p, active: true }))
  await seed()
  const rows = await db(`SELECT * FROM products ${includeHidden ? '' : 'WHERE active'} ORDER BY position, name`)
  return rows.map(fromRow)
}

/** Crea o actualiza un producto. Sin posición, uno nuevo va al final de la lista. */
export async function save(p: AdminProduct, position?: number) {
  await db(
    `INSERT INTO products (id, position, active, name, category, brand, indication, detail, sizes, made_to_measure, bulky, price, stock, kind, media)
     VALUES ($1, COALESCE($2, (SELECT COALESCE(MAX(position), -1) + 1 FROM products)), $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
     ON CONFLICT (id) DO UPDATE SET
       active = $3, name = $4, category = $5, brand = $6, indication = $7, detail = $8, sizes = $9,
       made_to_measure = $10, bulky = $11, price = $12, stock = $13, kind = $14, media = $15, updated_at = now()`,
    [
      p.id,
      position ?? null,
      p.active,
      p.name,
      p.category,
      p.brand,
      p.indication,
      p.detail,
      JSON.stringify(p.sizes ?? []),
      Boolean(p.madeToMeasure),
      Boolean(p.bulky),
      p.price,
      p.stock,
      p.kind ?? null,
      JSON.stringify(p.media ?? []),
    ],
  )
}

export async function removeProduct(id: string) {
  const rows = await db(`DELETE FROM products WHERE id = $1 RETURNING id`, [id])
  return rows.length > 0
}

/** Guarda el orden en que se muestran los productos. */
export async function reorder(ids: string[]) {
  await db(`UPDATE products p SET position = o.n - 1 FROM unnest($1::text[]) WITH ORDINALITY AS o(id, n) WHERE p.id = o.id`, [ids])
}

// Valida lo que manda el panel. Devuelve el producto limpio, o un texto con el problema.
export function parseProduct(input: unknown): AdminProduct | string {
  const b = (input ?? {}) as Record<string, unknown>
  const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
  const int = (v: unknown) => (typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 100_000_000 ? v : null)

  const name = text(b.name, 120)
  if (!name) return 'Falta el nombre.'
  const price = int(b.price)
  if (price === null || price === 0) return 'El precio tiene que ser un número mayor a cero.'
  const stock = int(b.stock)
  if (stock === null) return 'El stock tiene que ser un número entero, 0 o más.'

  const id = typeof b.id === 'string' && /^[a-z0-9-]{1,80}$/.test(b.id) ? b.id : null
  if (!id) return 'Identificador inválido.'

  const sizes = Array.isArray(b.sizes) ? [...new Set(b.sizes.map((s) => text(s, 12)).filter(Boolean))].slice(0, 20) : []

  // Solo fotos subidas (https) o archivos propios de la tienda (/productos/...), y videos que ya estaban.
  const media: Media[] = []
  for (const m of Array.isArray(b.media) ? b.media.slice(0, 20) : []) {
    const src = typeof m?.src === 'string' && (m.src.startsWith('https://') || m.src.startsWith('/productos/')) ? m.src : null
    if (m?.type === 'image' && src) media.push({ type: 'image', src, alt: text(m.alt, 120) || undefined })
    else if (m?.type === 'video' && src) media.push({ type: 'video', src, poster: typeof m.poster === 'string' ? m.poster : undefined })
    else if (m?.type === 'youtube' && typeof m.id === 'string' && /^[\w-]{6,20}$/.test(m.id))
      media.push({ type: 'youtube', id: m.id, title: text(m.title, 120) || undefined })
  }

  return {
    id,
    active: b.active !== false,
    name,
    category: text(b.category, 40) || 'Otros',
    brand: text(b.brand, 60),
    indication: text(b.indication, 300),
    detail: text(b.detail, 300),
    sizes: sizes.length ? sizes : undefined,
    madeToMeasure: b.madeToMeasure === true,
    bulky: b.bulky === true,
    price,
    stock,
    kind: KINDS.includes(b.kind as ProductKind) ? (b.kind as ProductKind) : undefined,
    media: media.length ? media : undefined,
  }
}
