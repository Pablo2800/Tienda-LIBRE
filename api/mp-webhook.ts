// Mercado Pago avisa acá cada vez que cambia un pago (se configura solo al crear el pago).
//
// Variable de entorno opcional:
//   MP_WEBHOOK_SECRET → "Tus integraciones" > tu aplicación > Webhooks > Clave secreta.
//                       Si está, se rechazan los avisos que no vengan firmados por Mercado Pago.
//
// Próximo paso: cuando el pago queda aprobado y el pedido es con envío, crear el envío en Uber Direct
// con metadata.quote_id. Por ahora solo se registra en los logs de Vercel.
import { getPayment, mpConfigured, validSignature } from './_lib/mercadopago.js'
import { json } from './_lib/uber.js'

export async function POST(request: Request): Promise<Response> {
  if (!mpConfigured()) return json({ error: 'not_configured' }, 503)
  const url = new URL(request.url)
  const body = (await request.json().catch(() => ({}))) as { type?: string; data?: { id?: string } }
  const type = url.searchParams.get('type') ?? body.type
  const dataId = url.searchParams.get('data.id') ?? String(body.data?.id ?? '')
  if (type !== 'payment' || !dataId) return json({ ignored: true })

  const secret = process.env.MP_WEBHOOK_SECRET
  if (secret && !validSignature(request, dataId, secret)) return json({ error: 'invalid_signature' }, 401)

  try {
    const payment = await getPayment(dataId)
    console.log('mercadopago payment', { id: payment.id, status: payment.status, order: payment.external_reference })
    return json({ received: true })
  } catch (err) {
    console.error('mercadopago webhook failed', err)
    // Un error hace que Mercado Pago reintente más tarde.
    return json({ error: 'upstream' }, 500)
  }
}
