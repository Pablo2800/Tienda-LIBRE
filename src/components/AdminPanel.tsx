import { useCallback, useEffect, useMemo, useState } from 'react'
import { ars } from '../lib/format'
import { BrandMark } from './BrandMark'

// Panel del local en /admin: lista los pedidos guardados y permite cambiarles el estado.

type Status = 'pendiente_pago' | 'pagado' | 'preparado' | 'enviado' | 'entregado' | 'cancelado'

type Order = {
  id: string
  created_at: string
  status: Status
  payment_status: string | null
  name: string
  phone: string
  ship: 'moto' | 'retiro'
  street: string
  zone: string
  vehicle: 'moto' | 'auto'
  has_custom: boolean
  items: { key: string; title: string; quantity: number; unit_price: number }[]
  shipping: number
  total: number
}

const STATUS_LABEL: Record<Status, string> = {
  pendiente_pago: 'Esperando pago',
  pagado: 'Pagado, para preparar',
  preparado: 'Preparado',
  enviado: 'Enviado',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
}
const STATUS_STYLE: Record<Status, string> = {
  pendiente_pago: 'border-line text-muted',
  pagado: 'border-warn text-warn',
  preparado: 'border-accent text-accent',
  enviado: 'border-accent text-accent',
  entregado: 'border-line text-muted',
  cancelado: 'border-line text-muted line-through',
}

const FILTERS: { label: string; match: (s: Status) => boolean }[] = [
  { label: 'En curso', match: (s) => s === 'pagado' || s === 'preparado' || s === 'enviado' },
  { label: 'Esperando pago', match: (s) => s === 'pendiente_pago' },
  { label: 'Entregados', match: (s) => s === 'entregado' },
  { label: 'Cancelados', match: (s) => s === 'cancelado' },
  { label: 'Todos', match: () => true },
]

const KEY = 'ortopedia-admin'
const INPUT = 'w-full rounded-lg border border-line bg-bg px-3 py-2.5'

function readSaved() {
  try {
    return sessionStorage.getItem(KEY) ?? ''
  } catch {
    return ''
  }
}

const ERRORS: Record<string, string> = {
  unauthorized: 'Contraseña incorrecta.',
  admin_not_configured: 'Falta configurar ADMIN_PASSWORD en Vercel.',
  db_not_configured: 'Falta conectar la base de datos en Vercel (Storage).',
}

export function AdminPanel() {
  const [password, setPassword] = useState(readSaved)
  const [draft, setDraft] = useState('')
  const [orders, setOrders] = useState<Order[] | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState(0)

  const load = useCallback(async (pass: string) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin-orders', { headers: { Authorization: `Bearer ${pass}` } })
      const data = await res.json().catch(() => ({ error: 'server' }))
      if (!res.ok) {
        setError(ERRORS[data.error] ?? 'No pudimos cargar los pedidos. Probá de nuevo.')
        if (data.error === 'unauthorized') setPassword('')
        return
      }
      setOrders(data.orders)
      try {
        sessionStorage.setItem(KEY, pass)
      } catch {
        // Sin almacenamiento: hay que volver a poner la contraseña al recargar.
      }
    } catch {
      setError('No pudimos conectar con el servidor.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (password) load(password)
  }, [password, load])

  async function changeStatus(id: string, status: Status) {
    const prev = orders
    setOrders((list) => list?.map((o) => (o.id === id ? { ...o, status } : o)) ?? null)
    const res = await fetch('/api/admin-orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${password}` },
      body: JSON.stringify({ id, status }),
    }).catch(() => null)
    if (!res?.ok) {
      setOrders(prev)
      setError('No se pudo guardar el cambio de estado.')
    }
  }

  const visible = useMemo(() => orders?.filter((o) => FILTERS[filter].match(o.status)) ?? [], [orders, filter])

  return (
    <div className="min-h-dvh bg-bg">
      <header className="border-b border-line bg-surface">
        <div className="wrap flex items-center justify-between gap-3 py-4">
          <a href="/" className="flex items-center gap-2 font-display text-lg font-bold">
            <BrandMark />
            Pedidos
          </a>
          {password && (
            <div className="flex gap-2">
              <button className="btn-ghost py-2 text-sm" onClick={() => load(password)} disabled={loading}>
                {loading ? 'Cargando…' : 'Actualizar'}
              </button>
              <button
                className="btn-ghost py-2 text-sm"
                onClick={() => {
                  try {
                    sessionStorage.removeItem(KEY)
                  } catch {
                    // nada que borrar
                  }
                  setPassword('')
                  setOrders(null)
                }}
              >
                Salir
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="wrap flex flex-col gap-4 py-6">
        {!password ? (
          <form
            className="panel mx-auto w-full max-w-sm"
            onSubmit={(e) => {
              e.preventDefault()
              if (draft) setPassword(draft)
            }}
          >
            <h1 className="panel-title">Ingresar al panel</h1>
            <label className="text-[13px] font-semibold" htmlFor="admin-pass">
              Contraseña
            </label>
            <input id="admin-pass" type="password" className={INPUT} value={draft} onChange={(e) => setDraft(e.target.value)} autoComplete="current-password" autoFocus />
            {error && <span className="text-sm text-warn">{error}</span>}
            <button className="btn-primary" disabled={!draft || loading}>
              Entrar
            </button>
          </form>
        ) : (
          <>
            {error && <div className="rounded-[10px] border border-warn px-3.5 py-3 text-sm text-warn">{error}</div>}
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar pedidos">
              {FILTERS.map((f, i) => (
                <button key={f.label} className="chip" aria-pressed={i === filter} onClick={() => setFilter(i)}>
                  {f.label} {orders && <span className="opacity-70">({orders.filter((o) => f.match(o.status)).length})</span>}
                </button>
              ))}
            </div>
            {orders && visible.length === 0 && (
              <div className="rounded-xl border border-dashed border-line bg-surface p-10 text-center text-muted">No hay pedidos en esta lista.</div>
            )}
            <div className="grid gap-4 md:grid-cols-2">
              {visible.map((o) => (
                <OrderCard key={o.id} order={o} onStatus={(s) => changeStatus(o.id, s)} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}

function OrderCard({ order: o, onStatus }: { order: Order; onStatus: (s: Status) => void }) {
  const date = new Date(o.created_at).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
  return (
    <article className="panel gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="rounded-md border border-line bg-bg px-2 py-0.5 font-mono text-[13px]">#{o.id}</span>
          <span className="ml-2 text-[13px] text-muted">{date}</span>
        </div>
        <span className={`rounded-full border px-2.5 py-0.5 text-[12.5px] font-semibold ${STATUS_STYLE[o.status]}`}>{STATUS_LABEL[o.status]}</span>
      </div>

      <div>
        <b className="font-semibold">{o.name}</b> ·{' '}
        <a className="text-accent underline" href={`tel:${o.phone.replace(/[^\d+]/g, '')}`}>
          {o.phone}
        </a>
        <div className="text-sm text-muted">{o.ship === 'moto' ? `Envío en ${o.vehicle} a ${o.street}, ${o.zone}` : 'Retira en el local'}</div>
      </div>

      <div className="flex flex-col gap-1 border-t border-line pt-2.5 text-sm">
        {o.items.map((i) => (
          <div className="summary-row" key={i.key}>
            <span className="min-w-0">
              {i.quantity} × {i.title}
            </span>
            <span>{ars(i.unit_price * i.quantity)}</span>
          </div>
        ))}
        <div className="summary-row font-semibold">
          <span>Total</span>
          <span>{ars(o.total)}</span>
        </div>
      </div>

      {o.has_custom && <span className="hint">Incluye un producto a medida: coordinar la toma de molde.</span>}
      {o.payment_status && o.payment_status !== 'approved' && <span className="hint">Estado en Mercado Pago: {o.payment_status}</span>}

      <label className="flex items-center gap-2 text-sm">
        <span className="font-semibold">Estado</span>
        <select className={`${INPUT} py-2`} value={o.status} onChange={(e) => onStatus(e.target.value as Status)}>
          {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </label>
    </article>
  )
}
