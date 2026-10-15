import type { Product } from '../data/products'

// Ilustración de placeholder hasta tener las fotos reales de cada producto.
// Colores: --art (pieza principal), --art-soft (acolchado, tela), --metal (estructura).
const line = { fill: 'none', stroke: 'var(--metal)', strokeWidth: 5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

const SHAPES: Record<Product['kind'], React.ReactNode> = {
  insole: (
    <>
      <path d="M38 88c-10 0-14-10-12-26 2-18 4-36 16-46 10-8 24-6 30 6 6 12 2 26 0 38-2 14 0 28-12 28z" fill="var(--art)" />
      <path d="M46 70c-4-8-2-26 6-36" fill="none" stroke="var(--art-soft)" strokeWidth="5" strokeLinecap="round" />
      <path d="M78 88c-6 0-8-8-6-20 2-14 6-26 16-30 8-2 14 6 12 18-2 10-8 20-10 26-2 4-6 6-12 6z" fill="var(--art-soft)" />
    </>
  ),
  splint: (
    <>
      <path d="M14 56c0-10 8-16 18-16h46c6 0 12-6 20-6 8 0 12 6 12 12v20c0 6-4 10-10 10H32c-10 0-18-8-18-20z" fill="var(--art)" />
      <rect x="30" y="38" width="8" height="42" rx="3" fill="var(--art-soft)" />
      <rect x="56" y="38" width="8" height="42" rx="3" fill="var(--art-soft)" />
    </>
  ),
  afo: (
    <>
      <path d="M44 10h26v52c0 6 4 10 10 12l22 6c6 2 8 6 8 10H44c-6 0-10-4-10-10V20c0-6 4-10 10-10z" fill="var(--art)" />
      <rect x="40" y="22" width="34" height="8" rx="3" fill="var(--art-soft)" />
      <rect x="40" y="50" width="34" height="8" rx="3" fill="var(--art-soft)" />
    </>
  ),
  stocking: (
    <>
      <path d="M46 8h28v52c0 6 2 10 8 14l14 8c6 4 4 12-4 12H56c-8 0-12-6-12-14V8z" fill="var(--art-soft)" />
      <rect x="44" y="8" width="32" height="10" rx="3" fill="var(--art)" />
      <path d="M48 32h24M48 44h24" stroke="var(--art)" strokeWidth="3" opacity=".5" />
    </>
  ),
  knee: (
    <>
      <rect x="38" y="8" width="44" height="84" rx="14" fill="var(--art)" />
      <circle cx="60" cy="50" r="12" fill="var(--surface)" />
      <rect x="36" y="18" width="6" height="64" rx="3" fill="var(--metal)" />
      <rect x="78" y="18" width="6" height="64" rx="3" fill="var(--metal)" />
    </>
  ),
  lumbar: (
    <>
      <path d="M8 40c20-10 84-10 104 0v26c-20 10-84 10-104 0z" fill="var(--art)" />
      <path d="M30 34v38M46 32v42M74 32v42M90 34v38" stroke="var(--art-soft)" strokeWidth="4" strokeLinecap="round" />
    </>
  ),
  collar: (
    <>
      <ellipse cx="60" cy="58" rx="46" ry="26" fill="var(--art-soft)" />
      <ellipse cx="60" cy="50" rx="28" ry="12" fill="var(--surface)" />
      <path d="M48 76l12 10 12-10" fill="var(--art)" />
      <rect x="22" y="56" width="10" height="16" rx="3" fill="var(--art)" />
      <rect x="88" y="56" width="10" height="16" rx="3" fill="var(--art)" />
    </>
  ),
  toiletRiser: (
    <>
      <ellipse cx="60" cy="44" rx="44" ry="18" fill="var(--surface)" stroke="var(--line)" strokeWidth="3" />
      <ellipse cx="60" cy="44" rx="24" ry="9" fill="var(--bg)" />
      <path d="M16 44v18c0 10 20 18 44 18s44-8 44-18V44" fill="none" stroke="var(--line)" strokeWidth="3" />
      <rect x="54" y="70" width="12" height="8" rx="2" fill="var(--art)" />
    </>
  ),
  commode: (
    <>
      <path d="M28 46v44M92 46v44M24 30h72" {...line} />
      <path d="M24 30v18M96 30v18" {...line} />
      <rect x="32" y="44" width="56" height="10" rx="4" fill="var(--art)" />
      <rect x="40" y="58" width="40" height="22" rx="4" fill="var(--art-soft)" />
    </>
  ),
  walker: (
    <>
      <path d="M30 20h60M30 20l-8 72M90 20l8 72M30 52h60" {...line} />
      <rect x="24" y="14" width="14" height="10" rx="4" fill="var(--art)" />
      <rect x="82" y="14" width="14" height="10" rx="4" fill="var(--art)" />
    </>
  ),
  crutch: (
    <>
      <path d="M44 92l12-74M76 92l12-74" {...line} />
      <path d="M50 18c4-8 12-10 16-4M82 18c4-8 12-10 16-4" fill="none" stroke="var(--art)" strokeWidth="7" strokeLinecap="round" />
      <rect x="42" y="44" width="16" height="8" rx="3" fill="var(--art)" transform="rotate(10 50 48)" />
      <rect x="74" y="44" width="16" height="8" rx="3" fill="var(--art)" transform="rotate(10 82 48)" />
    </>
  ),
  wheelchair: (
    <>
      <circle cx="50" cy="66" r="26" fill="none" stroke="var(--metal)" strokeWidth="5" />
      <circle cx="94" cy="84" r="8" fill="none" stroke="var(--metal)" strokeWidth="5" />
      <path d="M36 14v42h38l20 28" {...line} />
      <rect x="36" y="44" width="40" height="10" rx="3" fill="var(--art)" />
      <rect x="32" y="14" width="10" height="34" rx="3" fill="var(--art)" />
    </>
  ),
}

export function ProductArt({ product }: { product: Product }) {
  return (
    <svg viewBox="0 0 120 100" role="img" aria-label={product.name}>
      {SHAPES[product.kind]}
    </svg>
  )
}
