// Cotización del envío: ubica la dirección del cliente y cobra según la distancia al local.
// Corre en el servidor porque checkout.ts usa el mismo cálculo y así el precio no se puede alterar.
import { parsePoint, quoteShipping } from './_lib/geo.js'
import { json } from './_lib/http.js'

type Body = { street?: string; zone?: string; vehicle?: string; point?: unknown }

export async function POST(request: Request): Promise<Response> {
  const { street, zone, vehicle, point } = ((await request.json().catch(() => ({}))) ?? {}) as Body
  if (!street?.trim() || !zone) return json({ error: 'missing_address' }, 400)
  return json(await quoteShipping(street.trim().slice(0, 120), zone, vehicle === 'auto' ? 'auto' : 'moto', parsePoint(point)))
}
