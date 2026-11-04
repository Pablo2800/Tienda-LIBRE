import { available, coverOf, type Product } from '../data/products'
import { Price } from './Price'
import { ProductArt } from './ProductArt'
import { Stock } from './Stock'

interface Props {
  product: Product
  onOpen: () => void
  onAdd: () => void
}

export function ProductCard({ product: p, onOpen, onAdd }: Props) {
  const cover = coverOf(p)
  const mediaCount = p.media?.length ?? 0
  // Con talles hay que elegir uno antes de comprar, así que se abre el detalle.
  const needsChoice = Boolean(p.sizes?.length)
  const soldOut = available(p) < 1
  return (
    <article className="flex flex-col text-center">
      <button
        className="relative grid aspect-square w-full place-items-center overflow-hidden rounded-md border border-line bg-white transition-colors hover:border-ink [&>svg]:w-[70%]"
        onClick={onOpen}
        aria-label={`Ver ${p.name}`}
      >
        {cover ? <img className="absolute inset-0 size-full object-contain p-4" src={cover} alt="" /> : <ProductArt product={p} />}
        {p.madeToMeasure && (
          <span className="absolute top-2.5 right-2.5 bg-[#111] px-2 py-1 font-condensed text-[12px] font-semibold tracking-[0.08em] text-white uppercase">
            A medida
          </span>
        )}
        {mediaCount > 1 && (
          <span className="absolute bottom-2 left-2 rounded-full border border-line bg-white px-2 py-0.5 text-[11.5px] font-semibold text-[#111]">
            {mediaCount} fotos y videos
          </span>
        )}
      </button>
      <div className="flex flex-1 flex-col items-center gap-1 px-1 pt-3.5">
        <span className="eyebrow">{p.brand || p.category}</span>
        <button className="line-clamp-2 leading-snug hover:underline" onClick={onOpen}>
          {p.name}
        </button>
        <Stock product={p} />
        <div className="mt-auto flex w-full flex-col items-center gap-3 pt-2">
          <Price product={p} className="text-[22px]" />
          <button
            className="btn-outline w-full hover:bg-ink hover:text-bg disabled:hover:bg-transparent disabled:hover:text-current"
            onClick={needsChoice ? onOpen : onAdd}
            disabled={soldOut}
          >
            {soldOut ? 'Sin stock' : needsChoice ? 'Elegir talle' : 'Agregar al carrito'}
          </button>
        </div>
      </div>
    </article>
  )
}
