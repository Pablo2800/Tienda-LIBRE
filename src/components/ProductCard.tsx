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
  const first = p.media?.[0]
  const cover = first?.type === 'image' ? first.src : first?.type === 'video' ? first.poster : undefined
  const mediaCount = p.media?.length ?? 0
  return (
    <article className="card">
      <button className="thumb thumb-btn" onClick={onOpen} aria-label={`Ver ${p.name}`}>
        {cover ? <img className="cover" src={cover} alt="" /> : <ProductArt product={p} />}
        {mediaCount > 1 && <span className="media-count">{mediaCount} fotos y videos</span>}
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
