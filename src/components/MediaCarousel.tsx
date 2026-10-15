import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import type { Media, Product } from '../data/products'
import { ProductArt } from './ProductArt'

// Carrusel de fotos y videos del producto. Con una sola imagen (o ninguna) no muestra controles.
export function MediaCarousel({ product }: { product: Product }) {
  const media = product.media ?? []
  const [index, setIndex] = useState(0)
  const startX = useRef<number | null>(null)

  if (media.length === 0) {
    return (
      <div className="gallery">
        <div className="stage">
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
    <div className="gallery" role="region" aria-roledescription="carrusel" aria-label={`Fotos y videos de ${product.name}`} tabIndex={0} onKeyDown={onKeyDown}>
      <div className="stage" onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
        <Slide key={index} media={current} productName={product.name} />
        {count > 1 && (
          <>
            <button className="nav prev" onClick={() => go(index - 1)} aria-label="Anterior">
              ‹
            </button>
            <button className="nav next" onClick={() => go(index + 1)} aria-label="Siguiente">
              ›
            </button>
            <span className="counter">
              {index + 1} / {count}
            </span>
          </>
        )}
      </div>
      {count > 1 && (
        <div className="thumbs">
          {media.map((m, i) => (
            <button key={i} className="thumb-item" aria-current={i === index} aria-label={`Ver ${label(m, i)}`} onClick={() => setIndex(i)}>
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
      {src ? <img src={src} alt="" /> : <span className="thumb-blank">{productName}</span>}
      {media.type !== 'image' && <span className="play" aria-hidden="true">▶</span>}
    </>
  )
}
