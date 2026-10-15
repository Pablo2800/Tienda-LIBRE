export function Stock({ n, detailed = false }: { n: number; detailed?: boolean }) {
  const low = n < 5
  return (
    <span className={`stock ${low ? 'low' : 'ok'}`}>
      {low ? `Últimas ${n} unidades` : detailed ? `En stock, ${n} unidades` : 'En stock'}
    </span>
  )
}
