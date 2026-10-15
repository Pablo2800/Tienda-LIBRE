import { BrandMark } from './BrandMark'

interface Props {
  query: string
  onQuery: (q: string) => void
  cartCount: number
  onOpenCart: () => void
}

export function Header({ query, onQuery, cartCount, onOpenCart }: Props) {
  return (
    <>
      <div className="bg-band text-[12.5px] text-band-ink">
        <div className="wrap flex flex-wrap justify-between gap-3 py-1.5">
          <span>Versión de demostración. Productos, precios y envío son de ejemplo.</span>
          <span>Mendoza · Atención lun a sáb 9 a 19 h</span>
        </div>
      </div>
      <header className="sticky top-[env(safe-area-inset-top)] z-20 border-b border-line bg-surface">
        <div className="wrap flex flex-wrap items-center gap-4 py-3">
          <div className="flex items-center gap-2 font-display text-[22px] font-bold tracking-[-0.01em] whitespace-nowrap">
            <BrandMark />
            Ortopedia Andina
          </div>
          <label className="relative min-w-0 flex-[1_1_260px]">
            <svg
              className="absolute top-1/2 left-[13px] -translate-y-1/2 text-muted"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(e) => onQuery(e.target.value)}
              placeholder="Buscá por producto o necesidad (ej. rodilla, lumbar, baño)"
              aria-label="Buscar productos"
              className="w-full rounded-full border border-line bg-bg py-2.5 pr-3.5 pl-[38px]"
            />
          </label>
          <button
            className="flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-2 font-semibold"
            onClick={onOpenCart}
            aria-label="Abrir carrito"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6" />
              <circle cx="10" cy="20" r="1.4" />
              <circle cx="17" cy="20" r="1.4" />
            </svg>
            Carrito
            <span className="inline-grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1.5 text-xs text-accent-ink tabular-nums">
              {cartCount}
            </span>
          </button>
        </div>
      </header>
    </>
  )
}
