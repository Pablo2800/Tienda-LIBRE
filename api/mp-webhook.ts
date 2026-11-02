// Mercado Pago avisa acá cada vez que cambia una orden de pago.
// Se configura en "Tus integraciones" > tu aplicación > Webhooks > Configurar notificaciones,
// con la URL https://<tu tienda>/api/mp-webhook y el evento "Order (Mercado Pago)".
//
// Variable de entorno opcional:
//   MP_WEBHOOK_SECRET → la clave secreta que muestra esa misma pantalla.
//                       Si está, se rechazan los avisos que no vengan firmados por Mercado Pago.
import { dbConfigured, recordPayment } from './_lib/db.js'
import { notifySale } from './_lib/mail.js'
import { getMpOrder, mpConfigured, payStatus, validSignature } from './_lib/mercadopago.js'
import { json } from './_lib/http.js'

export async function POST(request: Request): Promise<Response> {
  if (!mpConfigured()) return json({ error: 'not_configured' }, 503)
  const url = new URL(request.url)
  const body = (await request.json().catch(() => ({}))) as { type?: string; data?: { id?: string } }
  const type = url.searchParams.get('type') ?? body.type
  const dataId = url.searchParams.get('data.id') ?? String(body.data?.id ?? '')
  if (type !== 'order' || !dataId) return json({ ignored: true })

  const secret = process.env.MP_WEBHOOK_SECRET
  if (secret && !validSignature(request, dataId, secret)) return json({ error: 'invalid_signature' }, 401)

  try {
    const order = await getMpOrder(dataId)
    const status = payStatus(order)
    console.log('mercadopago order', { id: order.id, status: order.status, pay: status, pedido: order.external_reference })
    if (order.external_reference && dbConfigured()) {
      const paid = await recordPayment(order.external_reference, order.id, status)
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
