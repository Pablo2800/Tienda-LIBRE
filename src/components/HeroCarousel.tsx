import { useEffect, useMemo, useState } from 'react'
import { useCatalog } from '../context/CatalogContext'
import { coverOf } from '../data/products'
import { HERO } from '../data/home'
import { ProductArt } from './ProductArt'

// Banner principal de la portada: foto del producto sobre blanco y el texto sobre un bloque negro en diagonal.
// Cambia solo cada 6 segundos (salvo que el cliente pida menos movimiento o tenga el mouse encima).
export function HeroCarousel({ onCategory }: { onCategory: (c: string) => void }) {
  const catalog = useCatalog()
  const slides = useMemo(
    () =>
      HERO.map((s) => {
        const product = catalog.find(s.product ?? '') ?? catalog.products.find((p) => p.category === s.category)
        return { ...s, product, image: s.image ?? (product && coverOf(product)) }
      }).filter((s) => s.product || s.image),
    [catalog],
  )
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused || slides.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), 6000)
    return () => clearInterval(t)
  }, [paused, slides.length])

  if (!slides.length) return null
  const s = slides[index % slides.length]

  return (
    <section
      className="relative overflow-hidden border-b border-line bg-white"
      aria-roledescription="carrusel"
      aria-label="Destacados"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="mx-auto grid max-w-[1440px] md:min-h-[420px] md:grid-cols-[1fr_1.15fr]">
        <div className="relative grid aspect-[16/10] place-items-center md:aspect-auto [&>svg]:w-[55%] [&>svg]:max-w-[320px]">
          {s.image ? (
            <img key={s.image} className="absolute inset-0 size-full object-contain p-6 md:p-10" src={s.image} alt="" />
          ) : (
            s.product && <ProductArt product={s.product} />
          )}
        </div>
        <div className="relative flex flex-col justify-center gap-3 bg-band px-6 py-9 text-band-ink md:-ml-[14%] md:py-12 md:pr-[8%] md:pl-[20%] md:[clip-path:polygon(16%_0,100%_0,100%_100%,0_100%)]">
          <span className="self-start rounded-full border border-current/40 px-3 py-1 font-condensed text-[13px] font-medium tracking-[0.1em] uppercase">
            {s.eyebrow}
          </span>
          <h2 className="font-condensed text-[clamp(40px,6vw,72px)] leading-[0.95] font-bold tracking-[0.01em] uppercase">{s.title}</h2>
          <p className="max-w-[40ch] text-[15.5px] text-band-ink/80">{s.text}</p>
          <button className="btn-outline mt-2 self-start px-7 hover:bg-band-ink hover:text-band" onClick={() => onCategory(s.category)}>
            Ver más
          </button>
        </div>
      </div>
      {slides.length > 1 && (
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2 md:left-[calc(50%+90px)]">
          {slides.map((x, i) => (
            <button
              key={x.title}
              className={`h-1.5 rounded-full transition-all ${i === index % slides.length ? 'w-7 bg-band-ink' : 'w-3.5 bg-band-ink/40'}`}
              aria-current={i === index % slides.length}
              aria-label={`Ver destacado ${i + 1}: ${x.title}`}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      )}
    </section>
  )
}
