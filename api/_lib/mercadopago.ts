// Conexión con Mercado Pago (Checkout Pro), compartida por las funciones de /api.
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

export type Preference = {
  items: { id: string; title: string; quantity: number; unit_price: number; currency_id: 'ARS' }[]
  external_reference: string
  metadata: Record<string, string | number | boolean>
  back_urls: { success: string; failure: string; pending: string }
  auto_return?: 'approved'
  notification_url?: string
  payer?: { name: string; phone?: { number: string } }
  statement_descriptor?: string
}

export const createPreference = (body: Preference) =>
  mp<{ id: string; init_point: string }>('/checkout/preferences', { method: 'POST', body: JSON.stringify(body) })

export type Payment = {
  id: number
  status: 'approved' | 'pending' | 'in_process' | 'authorized' | 'rejected' | 'cancelled' | 'refunded' | 'charged_back'
  status_detail: string
  external_reference: string | null
  transaction_amount: number
  metadata: Record<string, unknown>
}

export const getPayment = (id: string) => mp<Payment>(`/v1/payments/${encodeURIComponent(id)}`)

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
