// Avisos por mail: al local en cada venta y arrepentimiento, y a los proveedores con sus productos.
//
// Se manda con Gmail (recomendado, sin dominio propio) o con Resend. Variables de entorno:
//   NOTIFY_EMAIL       → a qué mail llegan los avisos del local. Se pueden poner varios separados por coma.
//   Con Gmail:
//     GMAIL_USER         → el Gmail desde el que salen los mails (ej. libresalud@gmail.com).
//     GMAIL_APP_PASSWORD → contraseña de aplicación de esa cuenta (16 letras): myaccount.google.com/apppasswords,
//                          con la verificación en dos pasos activada. No es la contraseña normal.
//   Con Resend (si no hay Gmail):
//     RESEND_API_KEY → resend.com > API Keys.
//     MAIL_FROM      → opcional. Sin dominio propio verificado se usa onboarding@resend.dev,
//                      que solo puede mandar al mail con el que se creó la cuenta de Resend.
//
// Si falta la configuración no se manda nada y la tienda sigue funcionando.
import nodemailer, { type Transporter } from 'nodemailer'
import { mapLink } from '../../src/lib/shipping.js'
import { STORE } from '../../src/data/store.js'
import type { OrderItem, Supplier } from './db.js'

const gmailConfigured = () => Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD)
export const mailConfigured = () => Boolean(process.env.NOTIFY_EMAIL && (gmailConfigured() || process.env.RESEND_API_KEY))

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)
const ars = (n: number) => `$ ${Math.round(n).toLocaleString('es-AR')}`

const notifyTo = () => process.env.NOTIFY_EMAIL!.split(',').map((s) => s.trim())

let gmail: Transporter | null = null

// Sin destinatarios, el aviso va al local (NOTIFY_EMAIL). Si va a otro (un proveedor), la respuesta le llega al local.
async function send(subject: string, html: string, to?: string[]) {
  if (!mailConfigured()) return
  const recipients = to ?? notifyTo()
  const replyTo = to ? notifyTo() : undefined

  if (gmailConfigured()) {
    gmail ??= nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD!.replace(/\s/g, '') },
    })
    await gmail.sendMail({ from: `${STORE.name} <${process.env.GMAIL_USER}>`, to: recipients, replyTo, subject, html })
    return
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.MAIL_FROM || `${STORE.name} <onboarding@resend.dev>`,
      to: recipients,
      ...(replyTo && { reply_to: replyTo }),
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
  lat: number | null
  lng: number | null
  has_custom: boolean
  items: OrderItem[]
  total: number
}

const itemLine = (i: OrderItem, withSupplier: boolean) =>
  `${i.quantity} × ${esc(i.title)} · ${ars(i.unit_price * i.quantity)}` +
  (withSupplier && i.supplier ? ` <span style="color:#666">(de ${esc(i.supplier.name || i.supplier.email)})</span>` : '')

/**
 * Aviso de venta nueva, cuando el pago queda aprobado. Le llega al local con el pedido completo y,
 * si incluye productos de otra tienda, a cada proveedor un mail solo con lo suyo.
 * Un mail que falla no frena a los demás.
 */
export async function notifySale(o: PaidOrder, origin: string) {
  const items = o.items.map((i) => itemLine(i, true)).join('<br>')
  const mails = [
    send(
      `Venta nueva #${o.id}: ${o.name} · ${ars(o.total)}`,
      `<h2 style="font-family:sans-serif">Venta nueva, pagada</h2>` +
        table([
          ['Pedido', `#${esc(o.id)}`],
          ['Cliente', esc(o.name)],
          ['Teléfono', esc(o.phone)],
          [
            'Entrega',
            o.ship === 'moto'
              ? `Envío en ${esc(o.vehicle)} a ${esc(o.street)}, ${esc(o.zone)}` +
                (o.lat != null && o.lng != null ? ` · <a href="${mapLink({ lat: o.lat, lng: o.lng })}">Ver en el mapa</a>` : '')
              : 'Retira en el local',
          ],
          ['Productos', items],
          ['Total', `<b>${ars(o.total)}</b>`],
        ]) +
        (o.has_custom ? `<p style="font-family:sans-serif"><b>Incluye un producto a medida:</b> coordinar la toma de molde.</p>` : '') +
        (o.items.some((i) => i.supplier) ? `<p style="font-family:sans-serif">A los proveedores les llegó un aviso con sus productos.</p>` : '') +
        `<p style="font-family:sans-serif"><a href="${esc(origin)}/admin">Ver en el panel</a></p>`,
    ),
  ]

  // Un mail por proveedor, con sus productos. No lleva los datos del cliente: la entrega la coordina el local.
  const bySupplier = new Map<string, { supplier: Supplier; items: OrderItem[] }>()
  for (const i of o.items) {
    if (!i.supplier) continue
    const group = bySupplier.get(i.supplier.email) ?? { supplier: i.supplier, items: [] }
    group.items.push(i)
    bySupplier.set(i.supplier.email, group)
  }
  for (const { supplier, items: own } of bySupplier.values()) {
    const subtotal = own.reduce((sum, i) => sum + i.unit_price * i.quantity, 0)
    mails.push(
      send(
        `${STORE.name}: venta de tus productos, pedido #${o.id}`,
        `<h2 style="font-family:sans-serif">${supplier.name ? `Hola ${esc(supplier.name)}, ` : ''}se vendieron productos tuyos</h2>` +
          table([
            ['Pedido', `#${esc(o.id)}`],
            ['Productos', own.map((i) => itemLine(i, false)).join('<br>')],
            ['Subtotal (precio de venta)', `<b>${ars(subtotal)}</b>`],
            ['Entrega', o.ship === 'moto' ? `Envío a domicilio en ${esc(o.zone)}` : 'El cliente retira en el local'],
          ]) +
          `<p style="font-family:sans-serif">El pago ya está aprobado. ${esc(STORE.name)} se va a comunicar con vos para coordinar la entrega.` +
          (STORE.whatsapp ? ` Por consultas, escribinos por WhatsApp al +${esc(STORE.whatsapp)}.` : '') +
          `</p>`,
        [supplier.email],
      ),
    )
  }

  const results = await Promise.allSettled(mails)
  for (const r of results) if (r.status === 'rejected') console.error('sale mail failed', r.reason)
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
