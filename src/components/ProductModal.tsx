import type { Product } from '../data/products'
import { ars } from '../lib/format'
import { ProductArt } from './ProductArt'
import { Stock } from './Stock'

interface Props {
  product: Product
  onClose: () => void
  onAdd: () => void
}

export function ProductModal({ product: p, onClose, onAdd }: Props) {
  return (
    <>
      <div className="scrim" />
      <div className="modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="modal-box" role="dialog" aria-modal="true" aria-label={p.name}>
          <button className="x" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
          <div className="thumb">
            <ProductArt product={p} />
          </div>
          <div className="pd">
            <span className="cat">
              {p.category} · {p.brand}
            </span>
            <h2>{p.name}</h2>
            <span className="price" style={{ fontSize: 28 }}>
              {ars(p.price)}
            </span>
            <Stock n={p.stock} detailed />
            <table className="specs">
              <tbody>
                <tr>
                  <td>Código</td>
                  <td style={{ fontFamily: 'var(--mono)' }}>{p.code}</td>
                </tr>
                <tr>
                  <td>Compatible con</td>
                  <td>{p.fits}</td>
                </tr>
                <tr>
                  <td>Rendimiento</td>
                  <td>{p.yield} (ISO/IEC, 5 % de cobertura)</td>
                </tr>
                <tr>
                  <td>Envío</td>
                  <td>Moto en el día en Gran Mendoza, cotizado al ingresar tu dirección</td>
                </tr>
              </tbody>
            </table>
            <button className="primary" onClick={onAdd}>
              Agregar al carrito
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
