// Cotización de envío SIMULADA para la demo.
// En la versión real, quoteDelivery llama a nuestro backend, que a su vez llama a
// POST /v1/customers/{customer_id}/delivery_quotes de Uber Direct con la dirección
// de retiro (el local) y la de entrega, y devuelve el precio y el tiempo estimado.

export const STORE_ADDRESS = 'Av. San Martín 1200, Ciudad de Mendoza'

export type Vehicle = 'moto' | 'auto'

// Departamentos de Gran Mendoza con distancia aproximada en km desde el local.
export const ZONES: { name: string; km: number }[] = [
  { name: 'Ciudad de Mendoza', km: 2.5 },
  { name: 'Godoy Cruz', km: 5.5 },
  { name: 'Guaymallén', km: 6 },
  { name: 'Las Heras', km: 7 },
  { name: 'Maipú', km: 14 },
  { name: 'Luján de Cuyo', km: 16 },
  { name: 'Lavalle (no cubierto)', km: 38 },
]

const MAX_KM = 20

export type Quote = { ok: true; km: number; fee: number; etaMinutes: number; vehicle: Vehicle } | { ok: false }

// Los productos voluminosos (sillas de ruedas, andadores) no entran en una moto y van en auto.
export async function quoteDelivery(street: string, zone: string, vehicle: Vehicle): Promise<Quote> {
  const z = ZONES.find((x) => x.name === zone)
  if (!z) return { ok: false }
  await new Promise((r) => setTimeout(r, 900))
  const jitter = ([...street].reduce((a, c) => a + c.charCodeAt(0), 0) % 10) / 5
  const km = z.km + jitter
  if (km > MAX_KM) return { ok: false }
  const [base, perKm] = vehicle === 'auto' ? [4800, 950] : [2200, 520]
  return { ok: true, km, vehicle, fee: Math.round((base + km * perKm) / 50) * 50, etaMinutes: Math.round(25 + km * 2.2) }
}
