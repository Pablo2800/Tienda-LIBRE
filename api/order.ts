// Estado de un pago, para la pantalla a la que vuelve el cliente desde Mercado Pago (?pedido=...).
// Solo devuelve el estado: los datos del cliente no se exponen por esta ruta.
import { dbConfigured, getMpOrderId, recordPayment } from './_lib/db.js'
import { notifySale } from './_lib/mail.js'
import { getMpOrder, mpConfigured, payStatus } from './_lib/mercadopago.js'
import { json } from './_lib/http.js'

export async function GET(request: Request): Promise<Response> {
  if (!mpConfigured()) return json({ error: 'not_configured' }, 503)
  const url = new URL(request.url)
  const orderId = url.searchParams.get('pedido')
  if (!orderId) return json({ error: 'missing_order' }, 400)
  try {
    // El número de orden de Mercado Pago sale de la base. Sin base, se usa el que venga en la URL de vuelta.
    const fromDb = dbConfigured() ? await getMpOrderId(orderId) : null
    const mpOrderId = fromDb ?? url.searchParams.get('order_id')
    if (!mpOrderId) return json({ error: 'not_found' }, 404)
    const order = await getMpOrder(mpOrderId)
    if (order.external_reference !== orderId) return json({ error: 'not_found' }, 404)
    const status = payStatus(order)
    // También se registra acá, porque en local Mercado Pago no manda avisos al webhook.
    if (dbConfigured()) {
      // Si falla la base, igual se le muestra el resultado al cliente: el webhook lo registra después.
      const paid = await recordPayment(orderId, order.id, status).catch((err) => console.error('record payment failed', err))
      // El aviso al local sale una sola vez: acá o en el webhook, el primero que registra el pago.
      if (paid) await notifySale(paid, process.env.SITE_URL || url.origin).catch((err) => console.error('sale mail failed', err))
    }
    return json({ status, orderId })
  } catch (err) {
    console.error('mercadopago order lookup failed', err)
    return json({ error: 'upstream' }, 502)
  }
}
