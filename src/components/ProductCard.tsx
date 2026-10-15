import type { Product } from '../data/products'
import { Price } from './Price'
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
  // Con talles hay que elegir uno antes de comprar, así que se abre el detalle.
  const needsChoice = Boolean(p.sizes?.length)
  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-line bg-surface hover:border-accent">
      <button
        className="relative grid aspect-[4/3] w-full place-items-center overflow-hidden border-b border-line bg-bg [&>svg]:w-[70%]"
        onClick={onOpen}
        aria-label={`Ver ${p.name}`}
      >
        {cover ? <img className="size-full object-cover" src={cover} alt="" /> : <ProductArt product={p} />}
        {mediaCount > 1 && (
          <span className="absolute bottom-2 left-2 rounded-full border border-line bg-surface px-2 py-0.5 text-[11.5px] font-semibold text-ink">
            {mediaCount} fotos y videos
          </span>
        )}
      </button>
      <div className="flex flex-1 flex-col gap-1 px-3.5 pt-3 pb-3.5">
        <span className="eyebrow">
          {p.category} · {p.brand}
        </span>
        <span className="leading-tight font-semibold">{p.name}</span>
        <span className="line-clamp-2 text-[13px] text-muted">{p.indication}</span>
        <Stock product={p} />
        <div className="mt-auto flex items-center justify-between pt-2">
          <Price product={p} />
          <button className="rounded-lg bg-accent px-3 py-[9px] font-semibold text-accent-ink" onClick={needsChoice ? onOpen : onAdd}>
            {needsChoice ? 'Elegir talle' : 'Agregar'}
          </button>
        </div>
      </div>
    </article>
  )
}
