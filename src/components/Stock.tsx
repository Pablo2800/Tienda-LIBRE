import type { Product } from '../data/products'

export function Stock({ product, detailed = false }: { product: Product; detailed?: boolean }) {
  if (product.madeToMeasure) return <span className="stock custom">A medida · listo en 7 a 10 días hábiles</span>
  const n = product.stock
  const low = n < 5
  return (
    <span className={`stock ${low ? 'low' : 'ok'}`}>
      {low ? `Últimas ${n} unidades` : detailed ? `En stock, ${n} unidades` : 'En stock'}
    </span>
  )
}
