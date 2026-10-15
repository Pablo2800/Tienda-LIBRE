import { useEffect, useState } from 'react'
import { useCart } from '../context/CartContext'
import { findProduct } from '../data/products'
import { ars } from '../lib/format'
import { quoteDelivery, STORE_ADDRESS, ZONES, type Quote } from '../lib/shipping'
import { BrandMark } from './BrandMark'
import { OrderTracking } from './OrderTracking'

type Ship = '' | 'moto' | 'retiro'
const STEPS = ['Datos y envío', 'Pago', 'Seguimiento']

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
      const q = await quoteDelivery(street, zone)
      if (!cancelled) {
        setQuote(q)
        setQuoting(false)
      }
    }, 600)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [ship, zone, street])

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
    <section className="sheet" role="dialog" aria-modal="true" aria-label="Finalizar compra">
      <div className="sheet-head">
        <div className="wrap" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, width: '100%', flexWrap: 'wrap', paddingLeft: 0, paddingRight: 0 }}>
          <div className="brand" style={{ fontSize: 18 }}>
            <BrandMark />
            Finalizar compra
          </div>
          <div className="steps">
            {STEPS.map((s, i) => (
              <span key={s} className={i + 1 === step ? 'on' : ''}>
                {i + 1}. {s}
              </span>
            ))}
          </div>
          {step < 3 && (
            <button className="x" onClick={onClose} aria-label="Cerrar">
              ×
            </button>
          )}
        </div>
      </div>

      <div className="wrap co">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
          {step === 1 && (
            <>
              <div className="panel">
                <h3>Tus datos</h3>
                <div className="fields">
                  <div className="field">
                    <label htmlFor="f-name">Nombre y apellido</label>
                    <input id="f-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Laura Giménez" autoComplete="name" />
                  </div>
                  <div className="field">
                    <label htmlFor="f-phone">Teléfono</label>
                    <input id="f-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="261 555 0123" inputMode="tel" />
                    <span className="hint">El repartidor te llama a este número.</span>
                  </div>
                  <div className="field full">
                    <label htmlFor="f-street">Calle y número</label>
                    <input id="f-street" value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Ej. Belgrano 1450, piso 2 B" autoComplete="street-address" />
                  </div>
                  <div className="field full">
                    <label htmlFor="f-zone">Departamento</label>
                    <select id="f-zone" value={zone} onChange={(e) => setZone(e.target.value)}>
                      <option value="">Elegí tu departamento</option>
                      {ZONES.map((z) => (
                        <option key={z.name}>{z.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="panel">
                <h3>Forma de entrega</h3>
                <label className="opt">
                  <input type="radio" name="ship" checked={ship === 'moto'} onChange={() => setShip('moto')} />
                  <span>
                    <span className="t">Envío en moto, hoy</span>
                    <br />
                    <span className="s">Un repartidor lo retira del local y te lo lleva</span>
                  </span>
                  <span className="p">{quote?.ok ? ars(quote.fee) : 'Cotizar'}</span>
                </label>
                {ship === 'moto' && <QuoteBox quoting={quoting} quote={quote} hasAddress={Boolean(zone && street.trim())} />}
                <label className="opt">
                  <input type="radio" name="ship" checked={ship === 'retiro'} onChange={() => setShip('retiro')} />
                  <span>
                    <span className="t">Retiro en el local</span>
                    <br />
                    <span className="s">{STORE_ADDRESS}. Listo en 1 hora.</span>
                  </span>
                  <span className="p">Gratis</span>
                </label>
                <button className="primary" disabled={!ready} onClick={() => setStep(2)}>
                  Ir a pagar
                </button>
                {!ready && <span className="hint">Completá nombre, teléfono y dirección, y elegí cómo recibirlo.</span>}
              </div>
            </>
          )}

          {step === 2 && (
            <div className="panel">
              <h3>Pago</h3>
              <p className="hint" style={{ margin: 0 }}>
                En la versión real este botón abre el checkout de Mercado Pago y vuelve a la tienda cuando se aprueba el pago.
              </p>
              <button className="mp" onClick={pay} disabled={paying}>
                {paying ? 'Procesando pago…' : `Pagar ${ars(total)} con Mercado Pago`}
              </button>
              <button className="ghost" onClick={() => setStep(1)} disabled={paying}>
                Volver
              </button>
            </div>
          )}

          {step === 3 && (
            <OrderTracking
              orderId={orderId}
              customerName={name}
              delivery={ship === 'moto' ? { street, zone } : null}
              onFinish={onFinish}
            />
          )}
        </div>

        {step < 3 && (
          <div className="panel">
            <h3>Resumen</h3>
            {Object.entries(items).map(([id, n]) => {
              const p = findProduct(id)
              return p ? (
                <div className="row" style={{ fontSize: 14 }} key={id}>
                  <span style={{ minWidth: 0 }}>
                    {n} × {p.name}
                  </span>
                  <span>{ars(p.price * n)}</span>
                </div>
              ) : null
            })}
            <div className="row" style={{ borderTop: '1px solid var(--line)', paddingTop: 10 }}>
              <span>Subtotal</span>
              <span>{ars(subtotal)}</span>
            </div>
            <div className="row">
              <span>Envío</span>
              <span>{ship === 'moto' ? (quote?.ok ? ars(quote.fee) : '—') : ship === 'retiro' ? 'Sin cargo' : '—'}</span>
            </div>
            <div className="row total">
              <span>Total</span>
              <span>{ars(total)}</span>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

function QuoteBox({ quoting, quote, hasAddress }: { quoting: boolean; quote: Quote | null; hasAddress: boolean }) {
  if (quoting)
    return (
      <div className="quote">
        <span>
          <span className="loading" />
          Consultando cotización al servicio de envíos…
        </span>
      </div>
    )
  if (!quote) return hasAddress ? null : <span className="hint">Ingresá calle y departamento para cotizar.</span>
  if (!quote.ok)
    return (
      <div className="quote" style={{ borderColor: 'var(--warn)' }}>
        <b>Sin cobertura de moto para esa zona</b>
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
        En la versión real este precio lo devuelve la API de envíos (<code>POST /delivery_quotes</code>). Acá está simulado por distancia.
      </span>
    </div>
  )
}
