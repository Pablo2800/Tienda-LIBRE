// Sugerencias de direcciones mientras el cliente escribe, con Photon (buscador gratuito de OpenStreetMap
// pensado para autocompletar). Se consulta desde el navegador y solo dentro de Gran Mendoza.
import { ZONES } from './shipping'

export type AddressSuggestion = { street: string; zone: string; detail: string }

type Feature = {
  properties: { name?: string; street?: string; housenumber?: string; city?: string; county?: string; district?: string; locality?: string }
}

// Recuadro de Gran Mendoza (oeste, sur, este, norte).
const BBOX = '-69.1,-33.25,-68.45,-32.6'

const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/^departamento\s+/, '')
    .trim()

// OpenStreetMap nombra los departamentos de distintas formas: "Departamento Capital", "Mendoza", "Godoy Cruz"…
function zoneOf(p: Feature['properties']): string {
  for (const raw of [p.county, p.city, p.district, p.locality]) {
    if (!raw) continue
    const n = normalize(raw)
    if (n === 'capital' || n === 'mendoza' || n === 'ciudad de mendoza') return 'Ciudad de Mendoza'
    const z = ZONES.find((z) => normalize(z.name) === n)
    if (z) return z.name
  }
  return ''
}

export async function searchAddress(query: string, signal?: AbortSignal): Promise<AddressSuggestion[]> {
  const params = new URLSearchParams({ q: query, limit: '6', bbox: BBOX })
  params.append('layer', 'house')
  params.append('layer', 'street')
  const res = await fetch(`https://photon.komoot.io/api/?${params}`, { signal })
  if (!res.ok) return []
  const data = (await res.json()) as { features?: Feature[] }
  // Si el resultado es la calle sin altura, se conserva el número que escribió el cliente.
  const typedNumber = query.match(/\b\d{1,5}\b/)?.[0]
  const seen = new Set<string>()
  const out: AddressSuggestion[] = []
  for (const { properties: p } of data.features ?? []) {
    const streetName = p.street ?? p.name
    if (!streetName) continue
    const number = p.housenumber ?? typedNumber
    const street = number ? `${streetName} ${number}` : streetName
    const zone = zoneOf(p)
    const key = `${street}|${zone}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push({ street, zone, detail: [zone || p.city, 'Mendoza'].filter(Boolean).join(', ') })
  }
  return out
}
