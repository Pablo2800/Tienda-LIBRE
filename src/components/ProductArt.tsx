import type { Product } from '../data/products'

const INK = { c: 'var(--c)', m: 'var(--m)', y: 'var(--y)', k: 'var(--k)' }

// Ilustración de placeholder hasta tener las fotos reales de cada producto.
export function ProductArt({ product }: { product: Product }) {
  const col = INK[product.color]
  const box = { fill: 'var(--surface)', stroke: 'var(--line)', strokeWidth: 2 }
  const shapes = {
    toner: (
      <>
        <rect x="12" y="36" width="96" height="40" rx="8" {...box} />
        <rect x="12" y="36" width="22" height="40" rx="6" fill={col} />
        <rect x="40" y="48" width="56" height="5" rx="2" fill="var(--line)" />
        <rect x="40" y="58" width="38" height="5" rx="2" fill="var(--line)" />
      </>
    ),
    drum: (
      <>
        <rect x="10" y="40" width="100" height="34" rx="10" {...box} />
        <rect x="18" y="62" width="84" height="8" rx="4" fill="#3a8f4a" />
        <rect x="18" y="46" width="12" height="12" rx="3" fill={col} />
      </>
    ),
    ink: (
      <>
        <rect x="34" y="22" width="52" height="64" rx="6" {...box} />
        <rect x="34" y="22" width="52" height="18" rx="6" fill={col} />
        <rect x="48" y="78" width="24" height="8" rx="2" fill="var(--line)" />
      </>
    ),
    bottle: (
      <>
        <rect x="44" y="18" width="32" height="12" rx="3" fill="var(--k)" />
        <rect x="36" y="30" width="48" height="62" rx="10" {...box} />
        <rect x="40" y="54" width="40" height="34" rx="6" fill={col} />
      </>
    ),
    paper: (
      <>
        <rect x="18" y="44" width="84" height="40" rx="4" {...box} />
        <rect x="18" y="56" width="84" height="16" fill={col} opacity=".85" />
        <path d="M26 44v-6h68v6" fill="none" stroke="var(--line)" strokeWidth="2" />
      </>
    ),
  }
  return (
    <svg viewBox="0 0 120 100" role="img" aria-label={product.name}>
      {shapes[product.kind]}
    </svg>
  )
}
