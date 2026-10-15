import { useEffect, useState } from 'react'
import { useCart } from '../context/CartContext'
import { parseCartKey } from '../data/products'
import { ars } from '../lib/format'
import { quoteDelivery, STORE_ADDRESS, ZONES, type Quote } from '../lib/shipping'
import { BrandMark } from './BrandMark'
import { OrderTracking } from './OrderTracking'

type Ship = '' | 'moto' | 'retiro'
const STEPS = ['Datos y envío', 'Pago', 'Seguimiento']
const OPTION =
  'grid cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-[10px] border border-line px-3.5 py-3 has-checked:border-accent has-checked:bg-accent-soft'
const INPUT = 'w-full rounded-lg border border-line bg-bg px-3 py-2.5'
const LABEL = 'text-[13px] font-semibold'


export function Checkout({ onClose, onFinish }: { onClose: () => void; onFinish: () => void }) {
  const { items, subtotal } = useCart()
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [street, setStreet] = useState('')
  const [zone, setZone] = useState('')
  const [ship, setShip] = useState<Ship>('')
  const [quote, setQuote] = useState<Quote | null>(null)
  const [quoting, setQuoting] = useState(false)
  const [paying, setPaying] = useState(false)
  const [orderId, setOrderId] = useState('')
  const lines = Object.entries(items).map(([key, n]) => ({ key, n, ...parseCartKey(key) }))
  const vehicle = lines.some((l) => l.product?.bulky) ? 'auto' : 'moto'
  const hasCustom = lines.some((l) => l.product?.madeToMeasure)

  // Pide una cotización nueva cuando cambia la dirección (con una pequeña espera mientras se tipea).
  useEffect(() => {
    setQuote(null)
    if (ship !== 'moto' || !zone || !street.trim()) {
      setQuoting(false)
      return
    }
    let cancelled = false
    setQuoting(true)
    const t = setTimeout(async () => {
      const q = await quoteDelivery(street, zone, vehicle)
      if (!cancelled) {
        setQuote(q)
        setQuoting(false)
      }
    }, 600)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [ship, zone, street, vehicle])

  const shipFee = ship === 'moto' && quote?.ok ? quote.fee : 0
  const total = subtotal + shipFee
  const ready = Boolean(name.trim() && phone.trim() && (ship === 'retiro' || (ship === 'moto' && quote?.ok)))

  function pay() {
    setPaying(true)
    setTimeout(() => {
      setOrderId(String(Math.floor(10000 + Math.random() * 89999)))
      setStep(3)
    }, 1200)
  }

  return (
    <section className="fixed inset-0 z-[60] overflow-auto bg-bg pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]" role="dialog" aria-modal="true" aria-label="Finalizar compra">
      <div className="border-b border-line bg-surface px-[18px] py-4">
        <div className="mx-auto flex w-full max-w-[1180px] flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-display text-lg font-bold">
            <BrandMark />
            Finalizar compra
          </div>
          <div className="flex flex-wrap gap-1.5 text-[13px] text-muted">
            {STEPS.map((s, i) => (
              <span key={s} className={`rounded-full border px-2.5 py-1 ${i + 1 === step ? 'border-ink bg-ink text-bg' : 'border-line'}`}>
                {i + 1}. {s}
              </span>
            ))}
          </div>
          {step < 3 && (
            <button className="btn-close" onClick={onClose} aria-label="Cerrar">
              ×
            </button>
          )}
        </div>
      </div>

      <div className="wrap grid gap-5 pt-6 pb-12 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-5">
          {step === 1 && (
            <>
              <div className="panel">
                <h3 className="panel-title">Tus datos</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="flex min-w-0 flex-col gap-[5px]">
                    <label className={LABEL} htmlFor="f-name">Nombre y apellido</label>
                    <input className={INPUT} id="f-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Laura Giménez" autoComplete="name" />
                  </div>
                  <div className="flex min-w-0 flex-col gap-[5px]">
                    <label className={LABEL} htmlFor="f-phone">Teléfono</label>
                    <input className={INPUT} id="f-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="261 555 0123" inputMode="tel" />
                    <span className="hint">El repartidor te llama a este número.</span>
                  </div>
                  <div className="flex min-w-0 flex-col gap-[5px] md:col-span-2">
                    <label className={LABEL} htmlFor="f-street">Calle y número</label>
                    <input className={INPUT} id="f-street" value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Ej. Belgrano 1450, piso 2 B" autoComplete="street-address" />
                  </div>
                  <div className="flex min-w-0 flex-col gap-[5px] md:col-span-2">
                    <label className={LABEL} htmlFor="f-zone">Departamento</label>
                    <select className={INPUT} id="f-zone" value={zone} onChange={(e) => setZone(e.target.value)}>
                      <option value="">Elegí tu departamento</option>
                      {ZONES.map((z) => (
                        <option key={z.name}>{z.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="panel">
                <h3 className="panel-title">Forma de entrega</h3>
                <label className={OPTION}>
                  <input type="radio" name="ship" checked={ship === 'moto'} onChange={() => setShip('moto')} />
                  <span>
                    <span className="font-semibold">Envío en {vehicle}, hoy</span>
                    <br />
                    <span className="text-[13px] text-muted">
                      {vehicle === 'auto' ? 'Tu pedido incluye un producto voluminoso, así que va en auto' : 'Un repartidor lo retira del local y te lo lleva'}
                    </span>
                  </span>
                  <span className="price text-base">{quote?.ok ? ars(quote.fee) : 'Cotizar'}</span>
                </label>
                {ship === 'moto' && <QuoteBox quoting={quoting} quote={quote} hasAddress={Boolean(zone && street.trim())} vehicle={vehicle} />}
                <label className={OPTION}>
                  <input type="radio" name="ship" checked={ship === 'retiro'} onChange={() => setShip('retiro')} />
                  <span>
                    <span className="font-semibold">Retiro en el local</span>
                    <br />
                    <span className="text-[13px] text-muted">{STORE_ADDRESS}. Listo en 1 hora.</span>
                  </span>
                  <span className="price text-base">Gratis</span>
                </label>
                <button className="btn-primary" disabled={!ready} onClick={() => setStep(2)}>
                  Ir a pagar
                </button>
                {!ready && <span className="hint">Completá nombre, teléfono y dirección, y elegí cómo recibirlo.</span>}
              </div>
            </>
          )}

          {step === 2 && (
            <div className="panel">
              <h3 className="panel-title">Pago</h3>
              <p className="hint">
                En la versión real este botón abre el checkout de Mercado Pago y vuelve a la tienda cuando se aprueba el pago.
              </p>
              <button className="w-full rounded-[10px] bg-mercadopago px-4 py-[13px] text-base font-bold text-white disabled:opacity-60" onClick={pay} disabled={paying}>
                {paying ? 'Procesando pago…' : `Pagar ${ars(total)} con Mercado Pago`}
              </button>
              <button className="btn-ghost" onClick={() => setStep(1)} disabled={paying}>
                Volver
              </button>
            </div>
          )}

          {step === 3 && (
            <OrderTracking
              orderId={orderId}
              customerName={name}
              delivery={ship === 'moto' ? { street, zone, vehicle } : null}
              hasCustom={hasCustom}
              onFinish={onFinish}
            />
          )}
        </div>

        {step < 3 && (
          <div className="panel">
            <h3 className="panel-title">Resumen</h3>
            {lines.map(({ key, n, product: p, size }) =>
              p ? (
                <div className="summary-row text-sm" key={key}>
                  <span className="min-w-0">
                    {n} × {p.name}
                    {size && ` (talle ${size})`}
                  </span>
                  <span>{ars(p.price * n)}</span>
                </div>
              ) : null,
            )}
            <div className="summary-row border-t border-line pt-2.5">
              <span>Subtotal</span>
              <span>{ars(subtotal)}</span>
            </div>
            <div className="summary-row">
              <span>Envío</span>
              <span>{ship === 'moto' ? (quote?.ok ? ars(quote.fee) : '—') : ship === 'retiro' ? 'Sin cargo' : '—'}</span>
            </div>
            <div className="summary-row font-display text-xl font-bold">
              <span>Total</span>
              <span>{ars(total)}</span>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

function QuoteBox({ quoting, quote, hasAddress, vehicle }: { quoting: boolean; quote: Quote | null; hasAddress: boolean; vehicle: string }) {
  if (quoting)
    return (
      <div className="quote">
        <span>
          <span className="spinner text-accent" />
          Consultando cotización al servicio de envíos…
        </span>
      </div>
    )
  if (!quote) return hasAddress ? null : <span className="hint">Ingresá calle y departamento para cotizar.</span>
  if (!quote.ok)
    return (
      <div className="quote border-warn">
        <b>Sin cobertura de envío en {vehicle} para esa zona</b>
        <span>Podés elegir retiro en local.</span>
      </div>
    )
  return (
    <div className="quote">
      <b>Cotización recibida: {ars(quote.fee)}</b>
      <span>
        {quote.km.toFixed(1)} km desde el local · llega en {quote.etaMinutes} min aprox.
      </span>
      <span className="hint">
        En la versión real este precio lo devuelve la API de envíos (<code className="font-mono text-xs">POST /delivery_quotes</code>). Acá está simulado por distancia.
      </span>
    </div>
  )
}
