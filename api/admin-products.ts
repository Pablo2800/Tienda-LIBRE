// Productos para el panel del local (/admin): listar, crear o editar, borrar y ordenar.
import { guard } from './_lib/admin.js'
import { listProducts, parseProduct, removeProduct, reorder, save } from './_lib/products.js'
import { json } from './_lib/uber.js'

export async function GET(request: Request): Promise<Response> {
  const denied = guard(request)
  if (denied) return denied
  try {
    return json({ products: await listProducts({ includeHidden: true }) })
  } catch (err) {
    console.error('list products failed', err)
    return json({ error: 'db' }, 502)
  }
}

// Crea el producto si el id es nuevo, o lo reemplaza si ya existe.
export async function PUT(request: Request): Promise<Response> {
  const denied = guard(request)
  if (denied) return denied
  const product = parseProduct(await request.json().catch(() => null))
  if (typeof product === 'string') return json({ error: 'invalid', message: product }, 400)
  try {
    await save(product)
    return json({ product })
  } catch (err) {
    console.error('save product failed', err)
    return json({ error: 'db' }, 502)
  }
}

export async function DELETE(request: Request): Promise<Response> {
  const denied = guard(request)
  if (denied) return denied
  const id = new URL(request.url).searchParams.get('id')
  if (!id) return json({ error: 'invalid' }, 400)
  try {
    return (await removeProduct(id)) ? json({ ok: true }) : json({ error: 'not_found' }, 404)
  } catch (err) {
    console.error('delete product failed', err)
    return json({ error: 'db' }, 502)
  }
}

// Recibe la lista de ids en el orden nuevo.
export async function PATCH(request: Request): Promise<Response> {
  const denied = guard(request)
  if (denied) return denied
  const { ids } = ((await request.json().catch(() => ({}))) ?? {}) as { ids?: unknown }
  if (!Array.isArray(ids) || !ids.every((id) => typeof id === 'string')) return json({ error: 'invalid' }, 400)
  try {
    await reorder(ids)
    return json({ ok: true })
  } catch (err) {
    console.error('reorder products failed', err)
    return json({ error: 'db' }, 502)
  }
}
