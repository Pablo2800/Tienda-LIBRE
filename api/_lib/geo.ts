// Ubica direcciones de Gran Mendoza en el mapa y calcula el precio del envío.
// Primero prueba el servicio de direcciones del Estado (Georef, gratis y sin clave) y después OpenStreetMap.
import { STORE } from '../../src/data/store.js'
import { priceForKm, roadKm, ZONES, type Point, type Quote, type Vehicle } from '../../src/lib/shipping.js'

// Recuadro de Gran Mendoza: un resultado fuera de acá es de otra ciudad con una calle del mismo nombre.
const inMendoza = (p: Point) => p.lat > -33.25 && p.lat < -32.6 && p.lng > -69.1 && p.lng < -68.45

const TIMEOUT = 4000

async function georef(street: string, zone: string): Promise<Point | null> {
  const params = new URLSearchParams({ direccion: street, provincia: 'Mendoza', max: '1' })
  // En Georef la Ciudad de Mendoza es el departamento "Capital".
  if (zone) params.set('departamento', zone === 'Ciudad de Mendoza' ? 'Capital' : zone)
  const res = await fetch(`https://apis.datos.gob.ar/georef/api/direcciones?${params}`, { signal: AbortSignal.timeout(TIMEOUT) })
  if (!res.ok) return null
  const data = (await res.json()) as { direcciones?: { ubicacion?: { lat: number | null; lon: number | null } }[] }
  const u = data.direcciones?.[0]?.ubicacion
  return u?.lat != null && u.lon != null ? { lat: u.lat, lng: u.lon } : null
}

async function osm(street: string, zone: string): Promise<Point | null> {
  const q = [street, zone, 'Mendoza', 'Argentina'].filter(Boolean).join(', ')
  const params = new URLSearchParams({ q, format: 'json', limit: '1', countrycodes: 'ar' })
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    headers: { 'User-Agent': 'tienda-libre (cotizador de envios)' },
    signal: AbortSignal.timeout(TIMEOUT),
  })
  if (!res.ok) return null
  const data = (await res.json()) as { lat: string; lon: string }[]
  return data[0] ? { lat: Number(data[0].lat), lng: Number(data[0].lon) } : null
}

export async function geocode(street: string, zone: string): Promise<Point | null> {
  for (const find of [georef, osm]) {
    try {
      const p = await find(street, zone)
      if (p && inMendoza(p)) return p
    } catch (err) {
      console.error(`geocode ${find.name} failed`, err)
    }
  }
  return null
}

// La ubicación del local se busca una vez por instancia si no está cargada en store.ts.
let storePoint: Promise<Point | null> | null = null
function storeLocation(): Promise<Point | null> {
  if (STORE.location) return Promise.resolve(STORE.location)
  storePoint ??= geocode(STORE.address, '').then((p) => {
    if (!p) storePoint = null // se reintenta en la próxima cotización
    return p
  })
  return storePoint
}

/** Cotiza el envío del local a la dirección. Si no ubica la calle, usa el centro del departamento. */
export async function quoteShipping(street: string, zoneName: string, vehicle: Vehicle): Promise<Quote> {
  const zone = ZONES.find((z) => z.name === zoneName)
  if (!zone) return { ok: false }
  const [from, to] = await Promise.all([storeLocation(), geocode(street, zone.name)])
  if (!from) return { ok: false }
  return priceForKm(roadKm(from, to ?? zone.center), vehicle, !to)
}
