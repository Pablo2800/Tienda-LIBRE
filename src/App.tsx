import { useEffect, useMemo, useState } from 'react'
import { Benefits } from './components/Benefits'
import { CartDrawer } from './components/CartDrawer'
import { CategoryTiles } from './components/CategoryTiles'
import { Checkout } from './components/Checkout'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { HeroCarousel } from './components/HeroCarousel'
import { PaymentReturn } from './components/PaymentReturn'
import { ProductCard } from './components/ProductCard'
import { ProductModal } from './components/ProductModal'
import { Revocation } from './components/Revocation'
import { CartProvider, useCart } from './context/CartContext'
import { CatalogProvider, useCatalog } from './context/CatalogContext'
import { cartKey } from './data/products'

type View =
  | { kind: 'none' }
  | { kind: 'product'; id: string }
  | { kind: 'cart' }
  | { kind: 'checkout' }
  | { kind: 'arrepentimiento' }
  | { kind: 'return'; orderId: string; mpOrderId: string | null }

// Al volver de Mercado Pago la URL trae ?pedido=... (y a veces order_id, el número de orden de Mercado Pago)
function initialView(): View {
  const params = new URLSearchParams(window.location.search)
  const orderId = params.get('pedido')
  if (!orderId) return { kind: 'none' }
  window.history.replaceState(null, '', window.location.pathname)
  const mpOrderId = params.get('order_id')
  return { kind: 'return', orderId, mpOrderId: mpOrderId && mpOrderId !== 'null' ? mpOrderId : null }
}

function Store() {
  const cart = useCart()
  const catalog = useCatalog()
  const [category, setCategory] = useState('Todos')
  const [query, setQuery] = useState('')
  const [view, setView] = useState<View>(initialView)
  const [toast, setToast] = useState('')

  const products = useMemo(() => {
    const t = query.trim().toLowerCase()
    return catalog.products.filter(
      (p) => (category === 'Todos' || p.category === category) && (!t || [p.name, p.indication, p.detail, p.category, p.brand].join(' ').toLowerCase().includes(t)),
    )
  }, [catalog, category, query])

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
    const added = cart.add(id)
    setToast(added ? 'Agregado al carrito' : 'No hay más stock de este producto')
    return added
  }
  const close = () => setView({ kind: 'none' })
  // La portada (banner, beneficios y categorías) se muestra solo sin búsqueda ni categoría elegida.
  const home = category === 'Todos' && !query.trim()
  const pickCategory = (c: string) => {
    setCategory(c)
    setQuery('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const openProduct = view.kind === 'product' ? catalog.find(view.id) : undefined

  return (
    <>
      <Header
        query={query}
        onQuery={setQuery}
        cartCount={cart.count}
        onOpenCart={() => setView({ kind: 'cart' })}
        categories={catalog.categories}
        category={category}
        onCategory={pickCategory}
      />

      <main>
        {home && (
          <>
            <HeroCarousel onCategory={pickCategory} />
            <Benefits />
            <CategoryTiles onCategory={pickCategory} />
          </>
        )}

        <section className="wrap pt-10 pb-14" aria-labelledby="productos">
          <h2 id="productos" className="section-title">
            {query.trim() ? `Resultados para “${query.trim()}”` : home ? 'Todos los productos' : category}
          </h2>
          <p className="mt-1 mb-7 text-center text-[13px] text-muted">
            {products.length} {products.length === 1 ? 'producto' : 'productos'}
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-[repeat(auto-fill,minmax(220px,1fr))] md:gap-x-6" aria-live="polite">
            {products.length === 0 && (
              <div className="col-span-full rounded-xl border border-dashed border-line bg-surface p-10 text-center text-muted">
                No encontramos productos para “{query}”. Probá con la zona del cuerpo o lo que necesitás, por ejemplo rodilla, lumbar o baño.
              </div>
            )}
            {products.map((p) => (
              <ProductCard key={p.id} product={p} onOpen={() => setView({ kind: 'product', id: p.id })} onAdd={() => add(p.id)} />
            ))}
          </div>
        </section>
      </main>

      <Footer categories={catalog.categories} onCategory={pickCategory} onRevocation={() => setView({ kind: 'arrepentimiento' })} />

      {openProduct && (
        <ProductModal
          product={openProduct}
          onClose={close}
          onAdd={(size) => {
            if (add(cartKey(openProduct.id, size))) setView({ kind: 'cart' })
          }}
        />
      )}
      {view.kind === 'arrepentimiento' && <Revocation onClose={close} />}
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
      {view.kind === 'return' && <PaymentReturn orderId={view.orderId} mpOrderId={view.mpOrderId} onApproved={cart.clear} onClose={close} />}
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
    <CatalogProvider>
      <CartProvider>
        <Store />
      </CartProvider>
    </CatalogProvider>
  )
}
