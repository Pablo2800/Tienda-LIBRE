// Conexión con Mercado Pago (Checkout Pro, API de Orders), compartida por las funciones de /api.
import { createHmac, timingSafeEqual } from 'node:crypto'

const API = 'https://api.mercadopago.com'

export const mpConfigured = () => Boolean(process.env.MP_ACCESS_TOKEN)

async function mp<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(API + path, {
    ...init,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`, ...init.headers },
  })
  if (!res.ok) throw new Error(`mercadopago ${path} ${res.status}: ${await res.text()}`)
  return (await res.json()) as T
}

// Checkout Pro con la API de Orders (/v1/orders), que reemplaza a la de Preferences.
// Los montos van como texto con dos decimales.
export type Item = { id: string; title: string; quantity: number; unit_price: number }

export type NewMpOrder = {
  external_reference: string
  items: Item[]
  payer?: { first_name: string }
  statement_descriptor?: string
  online: { success_url: string; failure_url: string; pending_url: string; auto_return?: 'approved' | 'all' }
}

const amount = (n: number) => n.toFixed(2)

export const createMpOrder = (o: NewMpOrder) =>
  mp<{ id: string; checkout_url: string }>('/v1/orders', {
    method: 'POST',
    // Con la misma clave Mercado Pago no crea dos órdenes si el pedido se reintenta.
    headers: { 'X-Idempotency-Key': `pedido-${o.external_reference}` },
    body: JSON.stringify({
      type: 'online',
      processing_mode: 'manual',
      external_reference: o.external_reference,
      total_amount: amount(o.items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0)),
      items: o.items.map((i) => ({ external_code: i.id, title: i.title, quantity: i.quantity, unit_price: amount(i.unit_price) })),
      ...(o.payer && { payer: o.payer }),
      config: { ...(o.statement_descriptor && { statement_descriptor: o.statement_descriptor }), online: o.online },
    }),
  })

export type MpOrder = {
  id: string
  status: string
  status_detail?: string
  external_reference?: string
  transactions?: { payments?: { id: string; status: string; status_detail?: string }[] }
}

export const getMpOrder = (id: string) => mp<MpOrder>(`/v1/orders/${encodeURIComponent(id)}`)

export type PayStatus = 'approved' | 'pending' | 'rejected'

/**
 * Resume el estado de la orden para la tienda:
 * approved = cobrada; pending = hay un pago en proceso (por ejemplo efectivo en Rapipago);
 * rejected = no hay pago (lo rechazaron, se canceló o el cliente volvió sin pagar).
 */
export function payStatus(o: MpOrder): PayStatus {
  if (o.status === 'processed') return 'approved'
  if (['canceled', 'cancelled', 'expired', 'failed', 'refunded'].includes(o.status)) return 'rejected'
  const payments = o.transactions?.payments ?? []
  return payments.some((p) => !['failed', 'rejected', 'canceled', 'cancelled'].includes(p.status)) ? 'pending' : 'rejected'
}

// Valida el header x-signature de un webhook, con la clave secreta de "Tus integraciones > Webhooks".
// Formato del header: "ts=1704908010,v1=<hmac sha256 en hex>".
export function validSignature(request: Request, dataId: string, secret: string): boolean {
  const header = request.headers.get('x-signature') ?? ''
  const parts = Object.fromEntries(header.split(',').map((p) => p.trim().split('=') as [string, string]))
  if (!parts.ts || !parts.v1) return false
  let manifest = `id:${dataId.toLowerCase()};`
  const requestId = request.headers.get('x-request-id')
  if (requestId) manifest += `request-id:${requestId};`
  manifest += `ts:${parts.ts};`
  const expected = createHmac('sha256', secret).update(manifest).digest('hex')
  return expected.length === parts.v1.length && timingSafeEqual(Buffer.from(expected), Buffer.from(parts.v1))
}
