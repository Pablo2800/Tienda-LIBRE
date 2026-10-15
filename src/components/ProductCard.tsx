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
  // Con talles o a medida hay que elegir algo antes de comprar, así que se abre el detalle.
  const needsChoice = Boolean(p.sizes?.length)
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
        <span className="indication">{p.indication}</span>
        <Stock product={p} />
        <div className="price-row">
          <span className="price">
            {p.madeToMeasure && <small>desde </small>}
            {ars(p.price)}
          </span>
          <button className="add" onClick={needsChoice ? onOpen : onAdd}>
            {needsChoice ? 'Elegir talle' : 'Agregar'}
          </button>
        </div>
      </div>
    </article>
  )
}
