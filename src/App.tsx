import { useEffect, useMemo, useState } from 'react'
import { CartDrawer } from './components/CartDrawer'
import { Checkout } from './components/Checkout'
import { Header } from './components/Header'
import { PaymentReturn } from './components/PaymentReturn'
import { ProductCard } from './components/ProductCard'
import { ProductModal } from './components/ProductModal'
import { CartProvider, useCart } from './context/CartContext'
import { CATEGORIES, PRODUCTS, cartKey, findProduct } from './data/products'
import { STORE_ADDRESS } from './lib/shipping'

// Beneficios que se muestran arriba a la derecha: [color del punto, título, texto].
const PERKS: [string, string, string][] = [
  ['bg-accent', 'Envío en el día', 'en moto, o en auto si es voluminoso'],
  ['bg-warm', 'A medida:', 'plantillas, férulas y ortesis hechas en nuestro taller'],
  ['bg-[var(--art-soft)]', 'Mercado Pago', 'con tarjeta, débito o dinero en cuenta'],
]

type View =
  | { kind: 'none' }
  | { kind: 'product'; id: string }
  | { kind: 'cart' }
  | { kind: 'checkout' }
  | { kind: 'return'; orderId: string; paymentId: string | null }

// Al volver de Mercado Pago la URL trae ?pedido=...&payment_id=...
function initialView(): View {
  const params = new URLSearchParams(window.location.search)
  const orderId = params.get('pedido')
  if (!orderId) return { kind: 'none' }
  window.history.replaceState(null, '', window.location.pathname)
  const paymentId = params.get('payment_id')
  return { kind: 'return', orderId, paymentId: paymentId && paymentId !== 'null' ? paymentId : null }
}

function Store() {
  const cart = useCart()
  const [category, setCategory] = useState('Todos')
  const [query, setQuery] = useState('')
  const [view, setView] = useState<View>(initialView)
  const [toast, setToast] = useState('')

  const products = useMemo(() => {
    const t = query.trim().toLowerCase()
    return PRODUCTS.filter(
      (p) => (category === 'Todos' || p.category === category) && (!t || [p.name, p.indication, p.detail, p.category, p.brand].join(' ').toLowerCase().includes(t)),
    )
  }, [category, query])

  useEffect(() => {
    document.body.style.overflow = view.kind === 'none' ? '' : 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && view.kind !== 'checkout' && view.kind !== 'return' && setView({ kind: 'none' })
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [view])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 1800)
    return () => clearTimeout(t)
  }, [toast])

  const add = (id: string) => {
    cart.add(id)
    setToast('Agregado al carrito')
  }
  const close = () => setView({ kind: 'none' })
  const openProduct = view.kind === 'product' ? findProduct(view.id) : undefined

  return (
    <>
      <Header query={query} onQuery={setQuery} cartCount={cart.count} onOpenCart={() => setView({ kind: 'cart' })} />

      <main className="wrap">
        <section className="grid items-end gap-6 pt-7 pb-2 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div>
            <h1 className="font-display text-[clamp(28px,4.4vw,44px)] leading-[1.05] font-bold tracking-[-0.02em] text-balance">
              Ortopedia y productos para tu recuperación, con envío en el día en Gran Mendoza
            </h1>
            <p className="mt-2.5 max-w-[56ch] text-muted">
              Fajas, rodilleras, medias de compresión, andadores y sillas de ruedas. También fabricamos plantillas, férulas y ortesis a medida en
              nuestro taller. Poné tu dirección y el costo de envío se calcula al instante.
            </p>
          </div>
          <ul className="flex flex-col gap-2 text-sm">
            {PERKS.map(([dot, title, text]) => (
              <li key={title} className="flex items-center gap-2.5 rounded-[10px] border border-line bg-surface px-3 py-2.5">
                <span className={`size-2.5 flex-none rounded-full ${dot}`} />
                <span>
                  <b className="font-semibold">{title}</b> {text}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <div className="flex flex-wrap items-center gap-2 pt-5 pb-3" role="group" aria-label="Categorías">
          {CATEGORIES.map((c) => (
            <button key={c} className="chip" aria-pressed={c === category} onClick={() => setCategory(c)}>
              {c}
            </button>
          ))}
          <span className="ml-auto text-[13px] text-muted">
            {products.length} {products.length === 1 ? 'producto' : 'productos'}
          </span>
        </div>

        <section className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4 pb-12" aria-live="polite">
          {products.length === 0 && (
            <div className="col-span-full rounded-xl border border-dashed border-line bg-surface p-10 text-center text-muted">
              No encontramos productos para “{query}”. Probá con la zona del cuerpo o lo que necesitás, por ejemplo rodilla, lumbar o baño.
            </div>
          )}
          {products.map((p) => (
            <ProductCard key={p.id} product={p} onOpen={() => setView({ kind: 'product', id: p.id })} onAdd={() => add(p.id)} />
          ))}
        </section>
      </main>

      <footer className="border-t border-line bg-surface text-[13px] text-muted">
        <div className="wrap flex flex-wrap justify-between gap-3 py-5">
          <span>Ortopedia Andina · {STORE_ADDRESS} (dirección de ejemplo)</span>
          <span>Precios en pesos argentinos, IVA incluido</span>
        </div>
      </footer>

      {openProduct && (
        <ProductModal
          product={openProduct}
          onClose={close}
          onAdd={(size) => {
            add(cartKey(openProduct.id, size))
            setView({ kind: 'cart' })
          }}
        />
      )}
      {view.kind === 'cart' && <CartDrawer onClose={close} onCheckout={() => setView({ kind: 'checkout' })} />}
      {view.kind === 'checkout' && (
        <Checkout
          onClose={close}
          onFinish={() => {
            cart.clear()
            close()
            setToast('Pedido de prueba finalizado')
          }}
        />
      )}
      {view.kind === 'return' && <PaymentReturn orderId={view.orderId} paymentId={view.paymentId} onApproved={cart.clear} onClose={close} />}
      {toast && (
        <div className="fixed bottom-[calc(20px+env(safe-area-inset-bottom))] left-1/2 z-[80] -translate-x-1/2 rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-bg">
          {toast}
        </div>
      )}
    </>
  )
}

export default function App() {
  return (
    <CartProvider>
      <Store />
    </CartProvider>
  )
}
