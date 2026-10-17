// Conexión con Uber Direct, compartida por las funciones de /api.
// Las carpetas que empiezan con "_" no se publican como rutas en Vercel.

export const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })

let cachedToken: { value: string; expiresAt: number } | null = null

async function getToken(clientId: string, clientSecret: string): Promise<string> {
  // El token dura 30 días: lo reutilizamos mientras la función siga activa.
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value
  const res = await fetch('https://auth.uber.com/oauth/v2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'client_credentials',
      scope: 'eats.deliveries',
    }),
  })
  if (!res.ok) throw new Error(`token ${res.status}: ${await res.text()}`)
  const data = (await res.json()) as { access_token: string; expires_in: number }
  cachedToken = { value: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 }
  return data.access_token
}

// Uber pide cada dirección como un JSON dentro de un string.
function address(street: string, city: string, zip: string) {
  return JSON.stringify({ street_address: [street], city, state: 'Mendoza', zip_code: zip, country: 'AR' })
}

export type UberQuote =
  | { ok: true; quoteId: string; fee: number; currency?: string; etaMinutes?: number; expires?: string }
  | { ok: false; code?: string; message?: string }

/** Devuelve null si faltan las credenciales de Uber. */
export async function uberQuote(street: string, zone: string, zip: string): Promise<UberQuote | null> {
  const env = process.env
  const { UBER_CLIENT_ID, UBER_CLIENT_SECRET, UBER_CUSTOMER_ID } = env
  if (!UBER_CLIENT_ID || !UBER_CLIENT_SECRET || !UBER_CUSTOMER_ID) return null

  const token = await getToken(UBER_CLIENT_ID, UBER_CLIENT_SECRET)
  const res = await fetch(`https://api.uber.com/v1/customers/${UBER_CUSTOMER_ID}/delivery_quotes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      pickup_address: address(env.STORE_STREET ?? 'Av. San Martín 1200', env.STORE_CITY ?? 'Ciudad de Mendoza', env.STORE_ZIP ?? '5500'),
      dropoff_address: address(street.trim(), zone, zip),
    }),
  })
  const data = (await res.json()) as {
    id?: string
    fee?: number
    currency?: string
    duration?: number
    expires?: string
    code?: string
    message?: string
  }
  // Uber responde 400 con un código (por ejemplo address_undeliverable) cuando no hay cobertura.
  if (!res.ok || data.fee == null || !data.id) return { ok: false, code: data.code, message: data.message }
  return {
    ok: true,
    quoteId: data.id,
    fee: data.fee / 100, // Uber devuelve el precio en centavos
    currency: data.currency,
    etaMinutes: data.duration,
    expires: data.expires,
  }
}
