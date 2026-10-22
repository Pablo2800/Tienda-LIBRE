// Avisos por mail al local, con Resend (resend.com, plan gratis de 3.000 mails por mes).
//
// Variables de entorno:
//   RESEND_API_KEY → resend.com > API Keys.
//   NOTIFY_EMAIL   → a qué mail llegan los avisos (el del local). Se pueden poner varios separados por coma.
//   MAIL_FROM      → opcional. Sin dominio propio verificado en Resend se usa onboarding@resend.dev,
//                    que solo puede mandar al mail con el que se creó la cuenta de Resend.
//
// Si falta la configuración no se manda nada y la tienda sigue funcionando.
import type { OrderItem } from './db.js'

export const mailConfigured = () => Boolean(process.env.RESEND_API_KEY && process.env.NOTIFY_EMAIL)

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)
const ars = (n: number) => `$ ${Math.round(n).toLocaleString('es-AR')}`

async function send(subject: string, html: string) {
  if (!mailConfigured()) return
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.MAIL_FROM || 'LIBRE Salud Deportiva <onboarding@resend.dev>',
      to: process.env.NOTIFY_EMAIL!.split(',').map((s) => s.trim()),
      subject,
      html,
    }),
  })
  if (!res.ok) throw new Error(`resend ${res.status}: ${await res.text()}`)
}

const table = (rows: [string, string][]) =>
  `<table cellpadding="6" style="border-collapse:collapse;font-family:sans-serif;font-size:14px">${rows
    .map(([k, v]) => `<tr><td style="color:#666">${esc(k)}</td><td>${v}</td></tr>`)
    .join('')}</table>`

export type PaidOrder = {
  id: string
  name: string
  phone: string
  ship: string
  street: string
  zone: string
  vehicle: string
  has_custom: boolean
  items: OrderItem[]
  total: number
}

/** Aviso de venta nueva, cuando el pago queda aprobado. */
export function notifySale(o: PaidOrder, origin: string) {
  const items = o.items.map((i) => `${i.quantity} × ${esc(i.title)} · ${ars(i.unit_price * i.quantity)}`).join('<br>')
  return send(
    `Venta nueva #${o.id}: ${o.name} · ${ars(o.total)}`,
    `<h2 style="font-family:sans-serif">Venta nueva, pagada</h2>` +
      table([
        ['Pedido', `#${esc(o.id)}`],
        ['Cliente', esc(o.name)],
        ['Teléfono', esc(o.phone)],
        ['Entrega', o.ship === 'moto' ? `Envío en ${esc(o.vehicle)} a ${esc(o.street)}, ${esc(o.zone)}` : 'Retira en el local'],
        ['Productos', items],
        ['Total', `<b>${ars(o.total)}</b>`],
      ]) +
      (o.has_custom ? `<p style="font-family:sans-serif"><b>Incluye un producto a medida:</b> coordinar la toma de molde.</p>` : '') +
      `<p style="font-family:sans-serif"><a href="${esc(origin)}/admin">Ver en el panel</a></p>`,
  )
}

/** Aviso de un pedido de arrepentimiento. */
export function notifyRevocation(r: { code: string; order_id: string; name: string; contact: string; reason: string }, origin: string) {
  return send(
    `Arrepentimiento de compra${r.order_id ? ` del pedido #${r.order_id}` : ''} · código ${r.code}`,
    `<h2 style="font-family:sans-serif">Pedido de arrepentimiento</h2>` +
      table([
        ['Código de revocación', `<b>${esc(r.code)}</b>`],
        ['Pedido', r.order_id ? `#${esc(r.order_id)}` : 'No lo indicó'],
        ['Nombre', esc(r.name)],
        ['Contacto', esc(r.contact)],
        ['Motivo', esc(r.reason) || '—'],
      ]) +
      `<p style="font-family:sans-serif">El cliente ya recibió este código en pantalla. Hay que contactarlo para coordinar la devolución.</p>` +
      `<p style="font-family:sans-serif"><a href="${esc(origin)}/admin">Ver en el panel</a></p>`,
  )
}
