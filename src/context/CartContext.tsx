import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { available } from '../data/products'
import { useCatalog } from './CatalogContext'

type Cart = Record<string, number>

interface CartValue {
  items: Cart
  count: number
  subtotal: number
  /** Cuántas unidades más se pueden agregar de ese producto según el stock. */
  room: (id: string) => number
  /** Suma una unidad. Devuelve false si no queda stock. */
  add: (id: string) => boolean
  change: (id: string, delta: number) => void
  clear: () => void
}

const CartContext = createContext<CartValue | null>(null)
const KEY = 'ortopedia-cart'

function load(parse: ReturnType<typeof useCatalog>['parse']): Cart {
  try {
    const saved: Cart = JSON.parse(localStorage.getItem(KEY) || '{}')
    // Descarta productos que ya no están en el catálogo o se quedaron sin stock.
    return Object.fromEntries(
      Object.entries(saved).flatMap(([k, n]) => {
        const p = parse(k).product
        const max = p ? available(p) : 0
        return max > 0 ? [[k, Math.min(n, max)]] : []
      }),
    )
  } catch {
    return {}
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { parse } = useCatalog()
  const [items, setItems] = useState<Cart>(() => load(parse))

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(items))
    } catch {
      /* sin almacenamiento: el carrito vive solo en memoria */
    }
  }, [items])

  const value = useMemo<CartValue>(() => {
    const entries = Object.entries(items)
    // Unidades en el carrito de un producto, sumando todos sus talles.
    const inCart = (key: string) => {
      const id = key.split('::')[0]
      return entries.reduce((a, [k, n]) => a + (k.split('::')[0] === id ? n : 0), 0)
    }
    const room = (key: string) => {
      const p = parse(key).product
      return p ? available(p) - inCart(key) : 0
    }
    return {
      items,
      count: entries.reduce((a, [, n]) => a + n, 0),
      subtotal: entries.reduce((a, [id, n]) => a + (parse(id).product?.price ?? 0) * n, 0),
      room,
      add: (id) => {
        if (room(id) < 1) return false
        setItems((c) => ({ ...c, [id]: (c[id] ?? 0) + 1 }))
        return true
      },
      change: (id, delta) => {
        if (delta > 0 && room(id) < delta) return
        setItems((c) => {
          const n = (c[id] ?? 0) + delta
          const next = { ...c }
          if (n <= 0) delete next[id]
          else next[id] = n
          return next
        })
      },
      clear: () => setItems({}),
    }
  }, [items, parse])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart debe usarse dentro de CartProvider')
  return ctx
}
