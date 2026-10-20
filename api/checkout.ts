// Crea el pago en Mercado Pago (Checkout Pro) y devuelve el link al que se redirige al cliente.
//
// Variables de entorno:
//   MP_ACCESS_TOKEN   → Mercado Pago, "Tus integraciones" > tu aplicación > Credenciales
//   SITE_URL          → opcional, la dirección pública de la tienda (por ejemplo https://mitienda.com.ar)
//
// Si falta MP_ACCESS_TOKEN responde 503 y la tienda simula el pago.
// Los precios se toman del catálogo y el envío se vuelve a cotizar acá: nunca se confía en lo que manda el navegador.
import { randomBytes } from 'node:crypto'
import { available, parseCartKey } from '../src/data/products.js'
import { simulatedQuote, ZONES } from '../src/lib/shipping.js'
import { createOrder, dbConfigured } from './_lib/db.js'
import { createPreference, mpConfigured, type Preference } from './_lib/mercadopago.js'
import { listProducts } from './_lib/products.js'
import { json, uberQuote } from './_lib/uber.js'

type Body = {
  items?: Record<string, number>
  name?: string
  phone?: string
  ship?: 'moto' | 'retiro'
  street?: string
  zone?: string
}

export async function POST(request: Request): Promise<Response> {
  if (!mpConfigured()) return json({ error: 'not_configured' }, 503)
  const body = ((await request.json().catch(() => ({}))) ?? {}) as Body
  const name = body.name?.trim().slice(0, 80)
  const phone = body.phone?.trim().slice(0, 30)
  if (!name || !phone) return json({ error: 'missing_contact' }, 400)

  // Productos: precio y stock salen del catálogo (de la base si está conectada).
  let catalog
  try {
    catalog = await listProducts()
  } catch (err) {
    console.error('load catalog failed', err)
    return json({ error: 'db' }, 502)
  }
  const items: Preference['items'] = []
  const units = new Map<string, number>() // unidades por producto, sumando todos los talles
  let bulky = false
  let hasCustom = false
  for (const [key, qty] of Object.entries(body.items ?? {})) {
    const { product, size } = parseCartKey(key, catalog)
    if (!product || !Number.isInteger(qty) || qty < 1) return json({ error: 'invalid_item', key }, 400)
    units.set(product.id, (units.get(product.id) ?? 0) + qty)
    if (units.get(product.id)! > available(product)) return json({ error: 'no_stock', key }, 400)
    if (product.sizes && !(size && product.sizes.includes(size))) return json({ error: 'invalid_size', key }, 400)
    bulky ||= Boolean(product.bulky)
    hasCustom ||= Boolean(product.madeToMeasure)
    items.push({
      id: key,
      title: size ? `${product.name} (talle ${size})` : product.name,
      quantity: qty,
      unit_price: product.price,
      currency_id: 'ARS',
    })
  }
  if (!items.length) return json({ error: 'empty_cart' }, 400)

  // Envío: se cotiza de nuevo con Uber (o simulado si no hay credenciales).
  const vehicle = bulky ? 'auto' : 'moto'
  let shipping = 0
  let quoteId = ''
  if (body.ship === 'moto') {
    const zone = ZONES.find((z) => z.name === body.zone)
    const street = body.street?.trim().slice(0, 120)
    if (!zone || !street) return json({ error: 'missing_address' }, 400)
    try {
      const uber = await uberQuote(street, zone.name, zone.zip)
      const quote = uber ?? simulatedQuote(street, zone.name, vehicle)
      if (!quote.ok) return json({ error: 'no_coverage' }, 400)
      shipping = Math.round(quote.fee)
      if (uber?.ok) quoteId = uber.quoteId
    } catch (err) {
      console.error('uber quote failed', err)
      return json({ error: 'shipping_upstream' }, 502)
    }
  } else if (body.ship !== 'retiro') {
    return json({ error: 'missing_shipping' }, 400)
  }

  const origin = (process.env.SITE_URL || new URL(request.url).origin).replace(/\/$/, '')
  const orderId = randomBytes(4).toString('hex').toUpperCase()
  const back = `${origin}/?pedido=${orderId}`
  // Mercado Pago no acepta auto_return ni webhooks hacia direcciones http (por ejemplo localhost).
  const isPublic = origin.startsWith('https://')

  // El envío va como un ítem más, así se ve en el detalle del pago.
  if (shipping > 0) items.push({ id: 'envio', title: `Envío en ${vehicle}`, quantity: 1, unit_price: shipping, currency_id: 'ARS' })

  try {
    // El pedido se guarda antes de ir a pagar, como "pendiente de pago".
    // Si la base falla, igual se cobra: la venta queda registrada en Mercado Pago.
    if (dbConfigured()) {
      await createOrder({
        id: orderId,
        name,
        phone,
        ship: body.ship,
        street: body.ship === 'moto' ? (body.street ?? '').trim() : '',
        zone: body.ship === 'moto' ? (body.zone ?? '') : '',
        vehicle,
        quoteId,
        hasCustom,
        items: items.map((i) => ({ key: i.id, title: i.title, quantity: i.quantity, unit_price: i.unit_price })),
        shipping,
        total: items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0),
      }).catch((err) => console.error('save order failed', err))
    }
    const pref = await createPreference({
      items,
      external_reference: orderId,
      metadata: {
        order_id: orderId,
        name,
        phone,
        ship: body.ship,
        street: body.ship === 'moto' ? (body.street ?? '').trim() : '',
        zone: body.ship === 'moto' ? (body.zone ?? '') : '',
        vehicle,
        quote_id: quoteId,
        has_custom: hasCustom,
      },
      back_urls: { success: back, failure: back, pending: back },
      ...(isPublic && { auto_return: 'approved', notification_url: `${origin}/api/mp-webhook` }),
      payer: { name, phone: { number: phone } },
      statement_descriptor: 'LIBRE',
    })
    return json({ orderId, url: pref.init_point })
  } catch (err) {
    console.error('checkout failed', err)
    return json({ error: 'payment_upstream' }, 502)
  }
}
