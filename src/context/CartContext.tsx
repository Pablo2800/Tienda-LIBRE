import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { parseCartKey } from '../data/products'

type Cart = Record<string, number>

interface CartValue {
  items: Cart
  count: number
  subtotal: number
  add: (id: string) => void
  change: (id: string, delta: number) => void
  clear: () => void
}

const CartContext = createContext<CartValue | null>(null)
const KEY = 'ortopedia-cart'

function load(): Cart {
  try {
    const saved: Cart = JSON.parse(localStorage.getItem(KEY) || '{}')
    // Descarta productos que ya no están en el catálogo.
    return Object.fromEntries(Object.entries(saved).filter(([k]) => parseCartKey(k).product))
  } catch {
    return {}
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Cart>(load)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(items))
    } catch {
      /* sin almacenamiento: el carrito vive solo en memoria */
    }
  }, [items])

  const value = useMemo<CartValue>(() => {
    const entries = Object.entries(items)
    return {
      items,
      count: entries.reduce((a, [, n]) => a + n, 0),
      subtotal: entries.reduce((a, [id, n]) => a + (parseCartKey(id).product?.price ?? 0) * n, 0),
      add: (id) => setItems((c) => ({ ...c, [id]: (c[id] ?? 0) + 1 })),
      change: (id, delta) =>
        setItems((c) => {
          const n = (c[id] ?? 0) + delta
          const next = { ...c }
          if (n <= 0) delete next[id]
          else next[id] = n
          return next
        }),
      clear: () => setItems({}),
    }
  }, [items])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart debe usarse dentro de CartProvider')
  return ctx
}
