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
      <div className="demo-bar">
        <div className="wrap">
          <span>Versión de demostración. Productos, precios y envío son de ejemplo.</span>
          <span>Mendoza · Atención lun a sáb 9 a 19 h</span>
        </div>
      </div>
      <header className="top">
        <div className="wrap">
          <div className="brand">
            <BrandMark />
            Ortopedia Andina
          </div>
          <label className="search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(e) => onQuery(e.target.value)}
              placeholder="Buscá por producto o necesidad (ej. rodilla, lumbar, baño)"
              aria-label="Buscar productos"
            />
          </label>
          <button className="cart-btn" onClick={onOpenCart} aria-label="Abrir carrito">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6" />
              <circle cx="10" cy="20" r="1.4" />
              <circle cx="17" cy="20" r="1.4" />
            </svg>
            Carrito <span className="badge">{cartCount}</span>
          </button>
        </div>
      </header>
    </>
  )
}
