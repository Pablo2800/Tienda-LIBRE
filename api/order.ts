// Estado de un pago, para la pantalla a la que vuelve el cliente desde Mercado Pago.
// Solo devuelve el estado: los datos del cliente no se exponen por esta ruta.
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
    return json({ status: payment.status, orderId })
  } catch (err) {
    console.error('mercadopago payment lookup failed', err)
    return json({ error: 'upstream' }, 502)
  }
}
