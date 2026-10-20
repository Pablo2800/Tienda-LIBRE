import type { Product } from '../data/products'

export function Stock({ product, detailed = false }: { product: Product; detailed?: boolean }) {
  if (product.madeToMeasure) return <span className="text-xs font-semibold text-accent">A medida · listo en 7 a 10 días hábiles</span>
  const n = product.stock
  if (n < 1) return <span className="text-xs font-semibold text-muted">Sin stock</span>
  const low = n < 5
  return (
    <span className={`text-xs font-semibold ${low ? 'text-warn' : 'text-ok'}`}>
      {low ? (n === 1 ? 'Última unidad' : `Últimas ${n} unidades`) : detailed ? `En stock, ${n} unidades` : 'En stock'}
    </span>
  )
}
