import { useCatalog } from '../context/CatalogContext'
import { coverOf } from '../data/products'
import { ProductArt } from './ProductArt'

// Grilla de categorías de la portada: alterna bloques anchos en negro y bloques angostos en blanco,
// cada uno con la foto de un producto de la categoría y el botón "Ver más".
export function CategoryTiles({ onCategory }: { onCategory: (c: string) => void }) {
  const catalog = useCatalog()
  const tiles = catalog.categories
    .filter((c) => c !== 'Todos')
    .map((c) => {
      const inCat = catalog.products.filter((p) => p.category === c)
      const product = inCat.find((p) => coverOf(p)) ?? inCat[0]
      return { category: c, product, count: inCat.length }
    })
    .filter((t) => t.product)

  return (
    <section className="wrap py-10" aria-labelledby="categorias">
      <h2 id="categorias" className="section-title mb-6">
        Categorías
      </h2>
      <div className="grid gap-4 md:grid-cols-3 md:gap-5">
        {tiles.map((t, i) => {
          const wide = i % 4 === 0 || i % 4 === 3
          const cover = coverOf(t.product!)
          return (
            <button
              key={t.category}
              className={`group relative flex min-h-[170px] overflow-hidden rounded-md border border-line text-left md:min-h-[260px] ${wide ? 'bg-band text-band-ink md:col-span-2' : 'bg-white text-[#111]'}`}
              onClick={() => onCategory(t.category)}
            >
              <span
                className={`relative grid flex-none ${wide ? 'w-1/2' : 'w-[42%]'} place-items-center bg-white [&>svg]:w-[70%] [&>svg]:max-w-[200px] ${wide ? 'order-last [clip-path:polygon(18%_0,100%_0,100%_100%,0_100%)]' : ''}`}
              >
                {cover ? (
                  <img className="absolute inset-0 size-full object-contain p-5 transition-transform group-hover:scale-105" src={cover} alt="" />
                ) : (
                  <ProductArt product={t.product!} />
                )}
              </span>
              <span className="flex flex-1 flex-col justify-center gap-3 p-4 md:p-6">
                <span
                  className={`font-condensed leading-none font-bold tracking-[0.02em] text-balance uppercase [overflow-wrap:anywhere] ${wide ? 'text-[clamp(26px,2.8vw,40px)]' : 'text-[clamp(22px,2vw,28px)]'}`}
                >
                  {t.category}
                </span>
                <span className={`text-sm ${wide ? 'text-band-ink/70' : 'text-[#5e5e5e]'}`}>
                  {t.count} {t.count === 1 ? 'producto' : 'productos'}
                </span>
                <span
                  className={`btn-outline self-start ${wide ? 'group-hover:bg-band-ink group-hover:text-band' : 'group-hover:bg-[#111] group-hover:text-white'}`}
                >
                  Ver más
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
