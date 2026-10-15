import type { Product } from '../data/products'
import { ars } from '../lib/format'

export function Price({ product, className = '' }: { product: Product; className?: string }) {
  return (
    <span className={`price ${className}`}>
      {product.madeToMeasure && <small className="font-sans text-xs font-medium text-muted">desde </small>}
      {ars(product.price)}
    </span>
  )
}
