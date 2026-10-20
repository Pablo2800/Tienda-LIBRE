// Catálogo público de la tienda: los productos visibles, con precio y stock.
// Sin base de datos responde 503 y la tienda usa el catálogo de src/data/products.ts.
import { dbConfigured } from './_lib/db.js'
import { listProducts } from './_lib/products.js'
import { json } from './_lib/uber.js'

export async function GET(): Promise<Response> {
  if (!dbConfigured()) return json({ error: 'db_not_configured' }, 503)
  try {
    const res = json({ products: await listProducts() })
    // Vercel guarda la respuesta 30 segundos: un cambio en /admin tarda eso en verse.
    // El precio y el stock se vuelven a revisar al pagar, así que no se vende de más.
    res.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=300')
    return res
  } catch (err) {
    console.error('list products failed', err)
    return json({ error: 'db' }, 502)
  }
}
