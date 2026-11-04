import { ANNOUNCEMENT } from '../data/home'

interface Props {
  query: string
  onQuery: (q: string) => void
  cartCount: number
  onOpenCart: () => void
  categories: string[]
  category: string
  onCategory: (c: string) => void
}

export function Header({ query, onQuery, cartCount, onOpenCart, categories, category, onCategory }: Props) {
  return (
    <>
      <div className="bg-band px-4 py-2 text-center font-condensed text-[13px] font-medium tracking-[0.06em] text-band-ink uppercase">{ANNOUNCEMENT}</div>
      <header className="sticky top-[env(safe-area-inset-top)] z-20 border-b border-line bg-surface">
        <div className="wrap flex flex-wrap items-center gap-x-6 gap-y-3 pt-4 pb-3">
          <a href="/" className="flex-none" onClick={() => onCategory('Todos')}>
            <img src="/logo-libre.png" alt="LIBRE Salud Deportiva" width="361" height="128" className="h-11 w-auto md:h-12 dark:invert" />
          </a>
          <form
            className="order-last flex min-w-0 basis-full md:order-none md:ml-auto md:max-w-[360px] md:flex-1"
            role="search"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              type="search"
              value={query}
              onChange={(e) => onQuery(e.target.value)}
              placeholder="Buscá un producto o lo que necesitás"
              aria-label="Buscar productos"
              className="min-w-0 flex-1 rounded-l-md border border-r-0 border-line bg-bg px-3.5 py-2.5"
            />
            <button className="grid w-11 flex-none place-items-center rounded-r-md bg-accent text-accent-ink" aria-label="Buscar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
            </button>
          </form>
          <button className="relative ml-auto p-1.5 md:ml-0" onClick={onOpenCart} aria-label={`Abrir carrito, ${cartCount} productos`}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6" />
              <circle cx="10" cy="20" r="1.4" />
              <circle cx="17" cy="20" r="1.4" />
            </svg>
            <span className="absolute -top-0.5 -right-1 inline-grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[11px] font-semibold text-accent-ink tabular-nums">
              {cartCount}
            </span>
          </button>
        </div>
        <nav className="wrap no-scrollbar flex gap-7 overflow-x-auto" aria-label="Categorías">
          {categories.map((c) => (
            <button
              key={c}
              className="flex-none border-b-2 border-transparent pt-1 pb-2.5 font-condensed text-[15.5px] font-medium tracking-[0.06em] whitespace-nowrap text-muted uppercase hover:text-ink aria-pressed:border-ink aria-pressed:text-ink"
              aria-pressed={c === category}
              onClick={() => onCategory(c)}
            >
              {c === 'Todos' ? 'Inicio' : c}
            </button>
          ))}
        </nav>
      </header>
    </>
  )
}
