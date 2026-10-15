import { useCart } from '../context/CartContext'
import { parseCartKey } from '../data/products'
import { ars } from '../lib/format'
import { ProductArt } from './ProductArt'

export function CartDrawer({ onClose, onCheckout }: { onClose: () => void; onCheckout: () => void }) {
  const { items, subtotal, change } = useCart()
  const ids = Object.keys(items)
  return (
    <>
      <div className="scrim" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label="Carrito">
        <div className="drawer-head">
          <h2>Tu carrito</h2>
          <button className="x" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>
        <div className="lines">
          {ids.length === 0 && (
            <p className="hint" style={{ padding: '24px 0' }}>
              Tu carrito está vacío. Agregá productos desde el catálogo.
            </p>
          )}
          {ids.map((id) => {
            const { product: p, size } = parseCartKey(id)
            if (!p) return null
            return (
              <div className="line" key={id}>
                <div className="mini">
                  <ProductArt product={p} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div className="name" style={{ fontSize: 14 }}>
                    {p.name}
                  </div>
                  {(size || p.madeToMeasure) && <div className="line-meta">{size ? `Talle ${size}` : 'A medida'}</div>}
                  <div className="qty">
                    <button onClick={() => change(id, -1)} aria-label="Quitar uno">
                      −
                    </button>
                    <span>{items[id]}</span>
                    <button onClick={() => change(id, 1)} aria-label="Sumar uno">
                      +
                    </button>
                  </div>
                </div>
                <div className="price" style={{ fontSize: 16 }}>
                  {ars(p.price * items[id])}
                </div>
              </div>
            )
          })}
        </div>
        <div className="drawer-foot">
          <div className="row">
            <span>Subtotal</span>
            <b>{ars(subtotal)}</b>
          </div>
          <div className="row hint">
            <span>Envío</span>
            <span>Se calcula con tu dirección</span>
          </div>
          <button className="primary" onClick={onCheckout} disabled={!ids.length}>
            Continuar compra
          </button>
        </div>
      </aside>
    </>
  )
}
