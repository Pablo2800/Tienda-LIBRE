import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import type { Media, Product } from '../data/products'
import { ProductArt } from './ProductArt'

// Clases largas que se repiten, separadas para que el JSX se lea mejor.
const GALLERY = 'flex min-w-0 flex-col gap-2.5 border-line bg-bg p-3.5 max-md:border-b md:border-r focus-visible:-outline-offset-2'
const STAGE =
  'relative grid aspect-[4/3] max-w-full touch-pan-y h-full place-items-center overflow-hidden rounded-[10px] bg-surface select-none md:aspect-square [&>svg]:w-[70%] [&>img,&>video,&>iframe]:size-full [&>img,&>video,&>iframe]:object-contain [&>video]:bg-black'
const NAV =
  'absolute top-1/2 grid size-[38px] -translate-y-1/2 place-items-center rounded-full border border-line bg-surface pb-[3px] text-2xl leading-none text-ink shadow-[0_2px_8px_rgba(0,0,0,.12)]'

// Carrusel de fotos y videos del producto. Con una sola imagen (o ninguna) no muestra controles.
export function MediaCarousel({ product }: { product: Product }) {
  const media = product.media ?? []
  const [index, setIndex] = useState(0)
  const startX = useRef<number | null>(null)

  if (media.length === 0) {
    return (
      <div className={GALLERY}>
        <div className={STAGE}>
          <ProductArt product={product} />
        </div>
      </div>
    )
  }

  const count = media.length
  const go = (i: number) => setIndex((i + count) % count)
  const current = media[index]

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') go(index - 1)
    if (e.key === 'ArrowRight') go(index + 1)
  }
  const onPointerDown = (e: PointerEvent) => {
    startX.current = e.clientX
  }
  const onPointerUp = (e: PointerEvent) => {
    if (startX.current === null) return
    const dx = e.clientX - startX.current
    startX.current = null
    if (Math.abs(dx) > 40) go(dx < 0 ? index + 1 : index - 1)
  }

  return (
    <div className={GALLERY} role="region" aria-roledescription="carrusel" aria-label={`Fotos y videos de ${product.name}`} tabIndex={0} onKeyDown={onKeyDown}>
      <div className={STAGE} onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
        <Slide key={index} media={current} productName={product.name} />
        {count > 1 && (
          <>
            <button className={`${NAV} left-2.5`} onClick={() => go(index - 1)} aria-label="Anterior">
              ‹
            </button>
            <button className={`${NAV} right-2.5`} onClick={() => go(index + 1)} aria-label="Siguiente">
              ›
            </button>
            <span className="absolute top-2.5 left-2.5 rounded-full border border-line bg-surface px-2 py-0.5 text-xs tabular-nums">
              {index + 1} / {count}
            </span>
          </>
        )}
      </div>
      {count > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-0.5">
          {media.map((m, i) => (
            <button key={i} className="relative size-14 flex-none overflow-hidden rounded-lg border-2 border-transparent bg-surface aria-current:border-accent" aria-current={i === index} aria-label={`Ver ${label(m, i)}`} onClick={() => setIndex(i)}>
              <Thumb media={m} productName={product.name} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function label(m: Media, i: number) {
  if (m.type === 'image') return m.alt ?? `imagen ${i + 1}`
  return m.type === 'youtube' ? (m.title ?? 'video') : 'video'
}

// Solo se monta la diapositiva activa, así un video se corta al pasar a otra.
function Slide({ media, productName }: { media: Media; productName: string }) {
  if (media.type === 'image') return <img src={media.src} alt={media.alt ?? productName} draggable={false} />
  if (media.type === 'video') return <video src={media.src} poster={media.poster} controls playsInline preload="metadata" />
  return (
    <iframe
      src={`https://www.youtube-nocookie.com/embed/${media.id}`}
      title={media.title ?? `Video de ${productName}`}
      allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  )
}

function Thumb({ media, productName }: { media: Media; productName: string }) {
  const src = media.type === 'image' ? media.src : media.type === 'video' ? media.poster : `https://i.ytimg.com/vi/${media.id}/mqdefault.jpg`
  return (
    <>
      {src ? <img className="block size-full object-cover" src={src} alt="" /> : <span className="p-1 text-[10px] text-muted">{productName}</span>}
      {media.type !== 'image' && <span className="absolute inset-0 grid place-items-center bg-black/35 text-sm text-white" aria-hidden="true">▶</span>}
    </>
  )
}
