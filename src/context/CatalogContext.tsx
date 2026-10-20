import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { parseCartKey, SEED_PRODUCTS, type Product } from '../data/products'

// Catálogo de la tienda: viene de /api/products (lo que el local carga en /admin).
// Si no hay servidor o base (por ejemplo en local), se usa el catálogo de src/data/products.ts.

interface CatalogValue {
  products: Product[]
  categories: string[]
  find: (id: string) => Product | undefined
  parse: (key: string) => { product?: Product; size?: string }
}

const CatalogContext = createContext<CatalogValue | null>(null)

async function fetchCatalog(): Promise<Product[]> {
  try {
    const res = await fetch('/api/products')
    if (res.ok && res.headers.get('content-type')?.includes('application/json')) return (await res.json()).products
  } catch {
    // Sin servidor: catálogo de ejemplo.
  }
  return SEED_PRODUCTS
}

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[] | null>(null)

  useEffect(() => {
    fetchCatalog().then(setProducts)
  }, [])

  const value = useMemo<CatalogValue | null>(
    () =>
      products && {
        products,
        categories: ['Todos', ...new Set(products.map((p) => p.category))],
        find: (id) => products.find((p) => p.id === id),
        parse: (key) => parseCartKey(key, products),
      },
    [products],
  )

  // El resto de la tienda espera a tener el catálogo, así el carrito se arma con los precios reales.
  if (!value)
    return (
      <div className="grid min-h-dvh place-items-center text-muted" aria-busy="true">
        <span>
          <span className="spinner" />
          Cargando productos…
        </span>
      </div>
    )
  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCatalog() {
  const ctx = useContext(CatalogContext)
  if (!ctx) throw new Error('useCatalog debe usarse dentro de CatalogProvider')
  return ctx
}
