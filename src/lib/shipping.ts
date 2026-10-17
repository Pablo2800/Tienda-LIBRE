// Cotización de envío.
// quoteDelivery pide el precio real a /api/quote (función del servidor que llama a
// POST /v1/customers/{customer_id}/delivery_quotes de Uber Direct). Si el servidor no
// tiene credenciales todavía, o no responde, usa una cotización simulada por distancia.

export const STORE_ADDRESS = 'Av. San Martín 1200, Ciudad de Mendoza'

export type Vehicle = 'moto' | 'auto'

// Departamentos de Gran Mendoza con su código postal y distancia aproximada en km desde el local.
export const ZONES: { name: string; zip: string; km: number }[] = [
  { name: 'Ciudad de Mendoza', zip: '5500', km: 2.5 },
  { name: 'Godoy Cruz', zip: '5501', km: 5.5 },
  { name: 'Guaymallén', zip: '5519', km: 6 },
  { name: 'Las Heras', zip: '5539', km: 7 },
  { name: 'Maipú', zip: '5515', km: 14 },
  { name: 'Luján de Cuyo', zip: '5507', km: 16 },
  { name: 'Lavalle (no cubierto)', zip: '5533', km: 38 },
]

const MAX_KM = 20

export type Quote =
  | { ok: true; source: 'uber'; fee: number; etaMinutes: number; quoteId: string }
  | { ok: true; source: 'simulado'; fee: number; etaMinutes: number; km: number; vehicle: Vehicle }
  | { ok: false }

export async function quoteDelivery(street: string, zone: string, vehicle: Vehicle): Promise<Quote> {
  const z = ZONES.find((x) => x.name === zone)
  if (!z) return { ok: false }
  try {
    const res = await fetch('/api/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ street, zone: z.name, zip: z.zip }),
    })
    if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
      const data = await res.json()
      if (!data.ok) return { ok: false }
      return { ok: true, source: 'uber', fee: Math.round(data.fee), etaMinutes: data.etaMinutes, quoteId: data.quoteId }
    }
  } catch {
    // Sin servidor (por ejemplo, en una vista previa estática): seguimos con la simulación.
  }
  return simulate(street, z.km, vehicle)
}

// Los productos voluminosos (sillas de ruedas, andadores) no entran en una moto y van en auto.
async function simulate(street: string, zoneKm: number, vehicle: Vehicle): Promise<Quote> {
  await new Promise((r) => setTimeout(r, 900))
  const jitter = ([...street].reduce((a, c) => a + c.charCodeAt(0), 0) % 10) / 5
  const km = zoneKm + jitter
  if (km > MAX_KM) return { ok: false }
  const [base, perKm] = vehicle === 'auto' ? [4800, 950] : [2200, 520]
  return { ok: true, source: 'simulado', km, vehicle, fee: Math.round((base + km * perKm) / 50) * 50, etaMinutes: Math.round(25 + km * 2.2) }
}
