import type { Product } from '../data/products'
import { ars } from '../lib/format'
import { ProductArt } from './ProductArt'
import { Stock } from './Stock'

interface Props {
  product: Product
  onOpen: () => void
  onAdd: () => void
}

export function ProductCard({ product: p, onOpen, onAdd }: Props) {
  return (
    <article className="card">
      <button className="thumb thumb-btn" onClick={onOpen} aria-label={`Ver ${p.name}`}>
        <ProductArt product={p} />
      </button>
      <div className="info">
        <span className="cat">
          {p.category} · {p.brand}
        </span>
        <span className="name">{p.name}</span>
        <span className="yield">Rinde {p.yield}</span>
        <Stock n={p.stock} />
        <div className="price-row">
          <span className="price">{ars(p.price)}</span>
          <button className="add" onClick={onAdd}>
            Agregar
          </button>
        </div>
      </div>
    </article>
  )
}
