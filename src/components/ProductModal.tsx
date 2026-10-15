import { useState } from 'react'
import type { Product } from '../data/products'
import { ars } from '../lib/format'
import { MediaCarousel } from './MediaCarousel'
import { Stock } from './Stock'

interface Props {
  product: Product
  onClose: () => void
  onAdd: (size?: string) => void
}

export function ProductModal({ product: p, onClose, onAdd }: Props) {
  const [size, setSize] = useState<string>()
  const missingSize = Boolean(p.sizes?.length) && !size
  return (
    <>
      <div className="scrim" />
      <div className="modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="modal-box" role="dialog" aria-modal="true" aria-label={p.name}>
          <button className="x" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
          <MediaCarousel product={p} />
          <div className="pd">
            <span className="cat">
              {p.category} · {p.brand}
            </span>
            <h2>{p.name}</h2>
            <span className="price" style={{ fontSize: 28 }}>
              {p.madeToMeasure && <small>desde </small>}
              {ars(p.price)}
            </span>
            <Stock product={p} detailed />
            <table className="specs">
              <tbody>
                <tr>
                  <td>Indicado para</td>
                  <td>{p.indication}</td>
                </tr>
                <tr>
                  <td>Características</td>
                  <td>{p.detail}</td>
                </tr>
                {p.madeToMeasure && (
                  <tr>
                    <td>Cómo es a medida</td>
                    <td>Después de la compra te escribimos por WhatsApp para coordinar la toma de molde o de medidas en el local.</td>
                  </tr>
                )}
                <tr>
                  <td>Envío</td>
                  <td>
                    {p.bulky ? 'En auto' : 'En moto'} en el día en Gran Mendoza, cotizado al ingresar tu dirección
                  </td>
                </tr>
              </tbody>
            </table>
            {p.sizes?.length ? (
              <div className="sizes" role="group" aria-label="Talle">
                <span className="sizes-label">Talle</span>
                {p.sizes.map((s) => (
                  <button key={s} className="chip" aria-pressed={size === s} onClick={() => setSize(s)}>
                    {s}
                  </button>
                ))}
                <span className="hint">¿Dudas con el talle? Consultanos y te ayudamos a medir.</span>
              </div>
            ) : null}
            <button className="primary" onClick={() => onAdd(size)} disabled={missingSize}>
              {missingSize ? 'Elegí un talle' : 'Agregar al carrito'}
            </button>
            <p className="hint" style={{ margin: 0 }}>
              La información es orientativa y no reemplaza la indicación de tu médico o kinesiólogo.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
