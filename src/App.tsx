import { useEffect, useMemo, useState } from 'react'
import { CartDrawer } from './components/CartDrawer'
import { Checkout } from './components/Checkout'
import { Header } from './components/Header'
import { ProductCard } from './components/ProductCard'
import { ProductModal } from './components/ProductModal'
import { CartProvider, useCart } from './context/CartContext'
import { CATEGORIES, PRODUCTS, findProduct } from './data/products'
import { STORE_ADDRESS } from './lib/shipping'

type View = { kind: 'none' } | { kind: 'product'; id: string } | { kind: 'cart' } | { kind: 'checkout' }

function Store() {
  const cart = useCart()
  const [category, setCategory] = useState('Todos')
  const [query, setQuery] = useState('')
  const [view, setView] = useState<View>({ kind: 'none' })
  const [toast, setToast] = useState('')

  const products = useMemo(() => {
    const t = query.trim().toLowerCase()
    return PRODUCTS.filter(
      (p) => (category === 'Todos' || p.category === category) && (!t || [p.name, p.fits, p.code, p.brand].join(' ').toLowerCase().includes(t)),
    )
  }, [category, query])

  useEffect(() => {
    document.body.style.overflow = view.kind === 'none' ? '' : 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && view.kind !== 'checkout' && setView({ kind: 'none' })
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
        <section className="intro">
          <div>
            <h1>Toner, cartuchos y tambores con envío en el día en Gran Mendoza</h1>
            <p>Elegí el producto, poné tu dirección y el costo de envío se calcula al instante. Un repartidor lo retira del local y te lo lleva.</p>
          </div>
          <div className="perks">
            <div className="perk"><span className="dot" style={{ background: 'var(--c)' }} /><span><b>Envío en moto</b> cotizado según tu dirección</span></div>
            <div className="perk"><span className="dot" style={{ background: 'var(--m)' }} /><span><b>Mercado Pago</b> con tarjeta, débito o dinero en cuenta</span></div>
            <div className="perk"><span className="dot" style={{ background: 'var(--y)' }} /><span><b>Retiro en local</b> sin cargo</span></div>
          </div>
        </section>

        <div className="filters" role="group" aria-label="Categorías">
          {CATEGORIES.map((c) => (
            <button key={c} className="chip" aria-pressed={c === category} onClick={() => setCategory(c)}>
              {c}
            </button>
          ))}
          <span className="count">
            {products.length} {products.length === 1 ? 'producto' : 'productos'}
          </span>
        </div>

        <section className="grid" aria-live="polite">
          {products.length === 0 && (
            <div className="empty">No encontramos productos para “{query}”. Probá con el modelo de tu impresora, por ejemplo M102 o L3150.</div>
          )}
          {products.map((p) => (
            <ProductCard key={p.id} product={p} onOpen={() => setView({ kind: 'product', id: p.id })} onAdd={() => add(p.id)} />
          ))}
        </section>
      </main>

      <footer>
        <div className="wrap">
          <span>Cuyo Insumos · {STORE_ADDRESS} (dirección de ejemplo)</span>
          <span>Precios en pesos argentinos, IVA incluido</span>
        </div>
      </footer>

      {openProduct && (
        <ProductModal
          product={openProduct}
          onClose={close}
          onAdd={() => {
            add(openProduct.id)
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
      {toast && <div className="toast">{toast}</div>}
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
