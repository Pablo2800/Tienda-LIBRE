// Botón de arrepentimiento (Resolución 424/2020 de la Secretaría de Comercio Interior).
// El cliente pide revocar la compra; se le devuelve en el momento un código de revocación,
// se guarda el pedido en la base y se le avisa al local por mail.
import { randomBytes } from 'node:crypto'
import { createRevocation, dbConfigured } from './_lib/db.js'
import { mailConfigured, notifyRevocation } from './_lib/mail.js'
import { json } from './_lib/uber.js'

export async function POST(request: Request): Promise<Response> {
  const b = ((await request.json().catch(() => ({}))) ?? {}) as Record<string, unknown>
  const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
  const name = text(b.name, 80)
  const contact = text(b.contact, 120)
  if (!name || !contact) return json({ error: 'missing_contact' }, 400)
  if (!dbConfigured() && !mailConfigured()) return json({ error: 'not_configured' }, 503)

  // Código legible para dictar por teléfono, por ejemplo "ARR-7F3K-92QD".
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const chars = [...randomBytes(8)].map((n) => alphabet[n % alphabet.length]).join('')
  const revocation = {
    code: `ARR-${chars.slice(0, 4)}-${chars.slice(4)}`,
    order_id: text(b.orderId, 20).replace(/^#/, '').toUpperCase(),
    name,
    contact,
    reason: text(b.reason, 500),
  }

  // Alcanza con que quede registrado en uno de los dos lados.
  const origin = process.env.SITE_URL || new URL(request.url).origin
  const results = await Promise.allSettled([
    dbConfigured() ? createRevocation(revocation) : Promise.reject(new Error('sin base')),
    mailConfigured() ? notifyRevocation(revocation, origin) : Promise.reject(new Error('sin mail')),
  ])
  results.forEach((r) => r.status === 'rejected' && console.error('revocation', r.reason))
  if (!results.some((r) => r.status === 'fulfilled')) return json({ error: 'upstream' }, 502)
  return json({ code: revocation.code })
}
