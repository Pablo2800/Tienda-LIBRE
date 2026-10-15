import { useCart } from '../context/CartContext'
import { parseCartKey } from '../data/products'
import { ars } from '../lib/format'
import { ProductArt } from './ProductArt'

export function CartDrawer({ onClose, onCheckout }: { onClose: () => void; onCheckout: () => void }) {
  const { items, subtotal, change } = useCart()
  const ids = Object.keys(items)
  return (
    <>
      <div className="fixed inset-0 z-40 bg-[rgba(10,14,18,.45)]" onClick={onClose} />
      <aside
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[420px] flex-col bg-surface pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] shadow-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Carrito"
      >
        <div className="flex items-center justify-between border-b border-line px-[18px] py-4">
          <h2 className="font-display text-xl font-bold">Tu carrito</h2>
          <button className="btn-close" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>
        <div className="flex flex-1 flex-col overflow-auto px-[18px] py-2">
          {ids.length === 0 && <p className="hint py-6">Tu carrito está vacío. Agregá productos desde el catálogo.</p>}
          {ids.map((id) => {
            const { product: p, size } = parseCartKey(id)
            if (!p) return null
            return (
              <div className="grid grid-cols-[56px_minmax(0,1fr)_auto] items-center gap-3 border-b border-line py-3" key={id}>
                <div className="grid size-14 place-items-center rounded-lg bg-bg [&>svg]:w-4/5">
                  <ProductArt product={p} />
                </div>
                <div className="min-w-0">
                  <div className="text-sm leading-tight font-semibold">{p.name}</div>
                  {(size || p.madeToMeasure) && <div className="hint">{size ? `Talle ${size}` : 'A medida'}</div>}
                  <div className="mt-1.5 inline-flex items-center rounded-lg border border-line">
                    <button className="size-7" onClick={() => change(id, -1)} aria-label="Quitar uno">
                      −
                    </button>
                    <span className="min-w-[22px] text-center tabular-nums">{items[id]}</span>
                    <button className="size-7" onClick={() => change(id, 1)} aria-label="Sumar uno">
                      +
                    </button>
                  </div>
                </div>
                <div className="price text-base">{ars(p.price * items[id])}</div>
              </div>
            )
          })}
        </div>
        <div className="flex flex-col gap-3 border-t border-line px-[18px] py-4">
          <div className="summary-row">
            <span>Subtotal</span>
            <b>{ars(subtotal)}</b>
          </div>
          <div className="summary-row hint">
            <span>Envío</span>
            <span>Se calcula con tu dirección</span>
          </div>
          <button className="btn-primary" onClick={onCheckout} disabled={!ids.length}>
            Continuar compra
          </button>
        </div>
      </aside>
    </>
  )
}
