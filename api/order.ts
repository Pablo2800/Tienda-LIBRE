// Estado de un pago, para la pantalla a la que vuelve el cliente desde Mercado Pago.
// Solo devuelve el estado: los datos del cliente no se exponen por esta ruta.
import { dbConfigured, recordPayment } from './_lib/db.js'
import { notifySale } from './_lib/mail.js'
import { getPayment, mpConfigured } from './_lib/mercadopago.js'
import { json } from './_lib/uber.js'

export async function GET(request: Request): Promise<Response> {
  if (!mpConfigured()) return json({ error: 'not_configured' }, 503)
  const url = new URL(request.url)
  const paymentId = url.searchParams.get('payment_id')
  const orderId = url.searchParams.get('pedido')
  if (!paymentId || !/^\d+$/.test(paymentId) || !orderId) return json({ error: 'missing_payment' }, 400)
  try {
    const payment = await getPayment(paymentId)
    if (payment.external_reference !== orderId) return json({ error: 'not_found' }, 404)
    // También se registra acá, porque en local Mercado Pago no manda avisos al webhook.
    if (dbConfigured()) {
      // Si falla la base, igual se le muestra el resultado al cliente: el webhook lo registra después.
      const paid = await recordPayment(orderId, String(payment.id), payment.status).catch((err) => console.error('record payment failed', err))
      // El aviso al local sale una sola vez: acá o en el webhook, el primero que registra el pago.
      if (paid) await notifySale(paid, process.env.SITE_URL || url.origin).catch((err) => console.error('sale mail failed', err))
    }
    return json({ status: payment.status, orderId })
  } catch (err) {
    console.error('mercadopago payment lookup failed', err)
    return json({ error: 'upstream' }, 502)
  }
}
