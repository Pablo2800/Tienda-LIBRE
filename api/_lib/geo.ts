// Ubica direcciones de Gran Mendoza en el mapa y calcula el precio del envío.
// Primero prueba el servicio de direcciones del Estado (Georef, gratis y sin clave) y después OpenStreetMap.
import { STORE } from '../../src/data/store.js'
import { inMendoza, priceForKm, roadKm, ZONES, type Point, type Quote, type Vehicle } from '../../src/lib/shipping.js'

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
  // "Sarmiento 2445, Godoy Cruz, Mendoza": se separa la calle y se busca dentro de su departamento,
  // porque hay calles con el mismo nombre en varios departamentos.
  const street = STORE.address.split(',')[0].trim()
  const zone = ZONES.find((z) => STORE.address.toLowerCase().includes(z.name.toLowerCase()))?.name ?? ''
  storePoint ??= geocode(street, zone).then((p) => {
    if (!p) storePoint = null // se reintenta en la próxima cotización
    return p
  })
  return storePoint
}

/**
 * Cotiza el envío del local a la dirección. Si el cliente marcó el punto exacto (sugerencia o pin) se usa ese;
 * si no, se busca la calle, y si tampoco aparece, se usa el centro del departamento.
 */
export async function quoteShipping(street: string, zoneName: string, vehicle: Vehicle, point?: Point | null): Promise<Quote> {
  const zone = ZONES.find((z) => z.name === zoneName)
  if (!zone) return { ok: false }
  const picked = point && inMendoza(point) ? point : null
  const [from, found] = await Promise.all([storeLocation(), picked ?? geocode(street, zone.name)])
  if (!from) return { ok: false }
  const to = found ?? zone.center
  return priceForKm(roadKm(from, to), vehicle, to, !found)
}

/** Lee un punto que manda el navegador: dos números válidos o nada. */
export function parsePoint(v: unknown): Point | null {
  const p = v as Partial<Point> | null
  return p && Number.isFinite(p.lat) && Number.isFinite(p.lng) ? { lat: Number(p.lat), lng: Number(p.lng) } : null
}
