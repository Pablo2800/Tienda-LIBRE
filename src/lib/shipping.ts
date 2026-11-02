// Cotización de envío por distancia real entre el local y la dirección del cliente.
// El servidor (/api/quote) ubica las dos direcciones en el mapa, mide la distancia y aplica
// la tarifa de src/data/store.ts. Si no puede ubicar la calle, usa el centro del departamento.

import { STORE } from '../data/store.js'

export const STORE_ADDRESS = STORE.address

export type Vehicle = 'moto' | 'auto'
export type Point = { lat: number; lng: number }

// Departamentos de Gran Mendoza con su código postal y un punto central aproximado.
export const ZONES: { name: string; zip: string; center: Point }[] = [
  { name: 'Ciudad de Mendoza', zip: '5500', center: { lat: -32.8895, lng: -68.8458 } },
  { name: 'Godoy Cruz', zip: '5501', center: { lat: -32.9254, lng: -68.845 } },
  { name: 'Guaymallén', zip: '5519', center: { lat: -32.8975, lng: -68.7835 } },
  { name: 'Las Heras', zip: '5539', center: { lat: -32.85, lng: -68.828 } },
  { name: 'Maipú', zip: '5515', center: { lat: -32.983, lng: -68.785 } },
  { name: 'Luján de Cuyo', zip: '5507', center: { lat: -33.037, lng: -68.878 } },
  { name: 'Lavalle', zip: '5533', center: { lat: -32.723, lng: -68.592 } },
]

/** Link de Google Maps al punto de entrega, para el repartidor. */
export const mapLink = (p: Point) => `https://www.google.com/maps?q=${p.lat.toFixed(6)},${p.lng.toFixed(6)}`

// Las calles no van en línea recta: el recorrido real es en promedio un 30% más largo.
const ROAD_FACTOR = 1.3

/** Distancia aproximada de recorrido en km entre dos puntos. */
export function roadKm(a: Point, b: Point): number {
  const rad = Math.PI / 180
  const dLat = (b.lat - a.lat) * rad
  const dLng = (b.lng - a.lng) * rad
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2
  return 2 * 6371 * Math.asin(Math.sqrt(h)) * ROAD_FACTOR
}

// to es el punto de entrega usado para el cálculo, para mostrarlo en el mapa.
export type Quote = { ok: true; fee: number; etaMinutes: number; km: number; vehicle: Vehicle; approx: boolean; to: Point } | { ok: false }

// Recuadro de Gran Mendoza: un punto fuera de acá es de otra ciudad (o un pin movido muy lejos).
export const inMendoza = (p: Point) => p.lat > -33.25 && p.lat < -32.6 && p.lng > -69.1 && p.lng < -68.45

/** Precio para una distancia. approx indica que se usó el centro del departamento y no la dirección. */
export function priceForKm(km: number, vehicle: Vehicle, to: Point, approx = false): Quote {
  const { maxKm, markup, ...rates } = STORE.shipping
  if (km > maxKm) return { ok: false }
  const { base, perKm } = rates[vehicle]
  // Un mínimo de 1 km, para que dentro de la misma cuadra no cobre solo la base.
  const fee = Math.round(((base + Math.max(km, 1) * perKm) * (1 + markup)) / 50) * 50
  return { ok: true, fee, km, vehicle, approx, to, etaMinutes: Math.round(20 + km * 3) }
}

/** point: el lugar exacto que eligió el cliente (sugerencia o pin en el mapa). Sin point, el servidor busca la calle. */
export async function quoteDelivery(street: string, zone: string, vehicle: Vehicle, point: Point | null): Promise<Quote> {
  try {
    const res = await fetch('/api/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ street, zone, vehicle, point }),
    })
    if (res.headers.get('content-type')?.includes('application/json')) return (await res.json()) as Quote
  } catch {
    // Sin servidor (por ejemplo, en una vista previa estática): seguimos con el centro del departamento.
  }
  const z = ZONES.find((x) => x.name === zone)
  if (!z || !STORE.location) return { ok: false }
  const to = point ?? z.center
  return priceForKm(roadKm(STORE.location, to), vehicle, to, !point)
}
