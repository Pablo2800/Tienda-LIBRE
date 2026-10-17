// Cotización real de envío con Uber Direct. Corre en el servidor (función de Vercel),
// porque las credenciales no pueden quedar expuestas en el navegador.
//
// Variables de entorno (en Vercel: Settings > Environment Variables; en local: .env.local):
//   UBER_CLIENT_ID, UBER_CLIENT_SECRET, UBER_CUSTOMER_ID  → panel de Uber Direct, pestaña Developer
//   STORE_STREET, STORE_CITY, STORE_ZIP                  → dirección de retiro (opcionales)
//
// Si faltan las credenciales responde 503 y la tienda usa la cotización simulada.
import { json, uberQuote } from './_lib/uber.js'

type Body = { street?: string; zone?: string; zip?: string }

export async function POST(request: Request): Promise<Response> {
  const { street, zone, zip } = ((await request.json().catch(() => ({}))) ?? {}) as Body
  if (!street?.trim() || !zone || !zip) return json({ error: 'missing_address' }, 400)

  try {
    const quote = await uberQuote(street, zone, zip)
    if (!quote) return json({ error: 'not_configured' }, 503)
    return json(quote)
  } catch (err) {
    console.error('uber quote failed', err)
    return json({ error: 'upstream' }, 502)
  }
}
