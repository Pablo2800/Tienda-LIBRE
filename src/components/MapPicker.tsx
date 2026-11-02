// Mapa chico con un pin en la dirección de entrega. El cliente puede arrastrarlo (o tocar el mapa)
// para marcar su casa exacta. Se carga aparte, solo al abrir el checkout, para no sumar peso a la tienda.
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useRef } from 'react'
import type { Point } from '../lib/shipping'

const pin = L.divIcon({
  className: '',
  html: '<div style="width:22px;height:22px;border-radius:50% 50% 50% 0;background:#111;border:3px solid #fff;transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,.4)"></div>',
  iconSize: [22, 22],
  iconAnchor: [11, 22],
})

export default function MapPicker({ point, onMove }: { point: Point; onMove: (p: Point) => void }) {
  const el = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const marker = useRef<L.Marker | null>(null)
  const move = useRef(onMove)
  move.current = onMove

  useEffect(() => {
    const m = L.map(el.current!, { scrollWheelZoom: false }).setView([point.lat, point.lng], 16)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(m)
    const mk = L.marker([point.lat, point.lng], { icon: pin, draggable: true, keyboard: true, title: 'Tu dirección' }).addTo(m)
    const report = (ll: L.LatLng) => move.current({ lat: ll.lat, lng: ll.lng })
    mk.on('dragend', () => report(mk.getLatLng()))
    m.on('click', (e: L.LeafletMouseEvent) => {
      mk.setLatLng(e.latlng)
      report(e.latlng)
    })
    map.current = m
    marker.current = mk
    return () => {
      m.remove()
      map.current = null
    }
    // El mapa se crea una sola vez; los cambios de punto se aplican abajo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Cuando el punto cambia desde afuera (otra dirección elegida), se mueve el pin y el mapa.
  useEffect(() => {
    const mk = marker.current
    if (!mk) return
    const cur = mk.getLatLng()
    if (cur.lat === point.lat && cur.lng === point.lng) return
    mk.setLatLng([point.lat, point.lng])
    map.current?.setView([point.lat, point.lng], 16)
  }, [point.lat, point.lng])

  return <div ref={el} className="z-0 h-56 w-full overflow-hidden rounded-lg border border-line" aria-label="Mapa para marcar tu dirección" />
}
