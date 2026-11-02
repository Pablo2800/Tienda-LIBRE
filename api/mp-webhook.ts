// Mercado Pago avisa acá cada vez que cambia un pago (se configura solo al crear el pago).
//
// Variable de entorno opcional:
//   MP_WEBHOOK_SECRET → "Tus integraciones" > tu aplicación > Webhooks > Clave secreta.
//                       Si está, se rechazan los avisos que no vengan firmados por Mercado Pago.
//
// Actualiza el pedido en la base. Próximo paso: cuando el pago queda aprobado y el pedido
// es con envío, crear el envío en Uber Direct con el quote_id guardado.
import { dbConfigured, recordPayment } from './_lib/db.js'
import { notifySale } from './_lib/mail.js'
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
    if (payment.external_reference && dbConfigured()) {
      const paid = await recordPayment(payment.external_reference, String(payment.id), payment.status)
      // Si el mail falla no se reintenta el webhook: el pago ya quedó registrado.
      if (paid) await notifySale(paid, process.env.SITE_URL || url.origin).catch((err) => console.error('sale mail failed', err))
    }
    return json({ received: true })
  } catch (err) {
    console.error('mercadopago webhook failed', err)
    // Un error hace que Mercado Pago reintente más tarde.
    return json({ error: 'upstream' }, 500)
  }
}
