import { useCallback, useEffect, useState } from 'react'
import type { Media, Product } from '../data/products'
import { ars } from '../lib/format'
import { ProductArt } from './ProductArt'

// Pestaña "Productos" del panel: el local carga, edita, ordena y oculta productos, con fotos y stock.

type Item = Product & { active: boolean }

// El formulario guarda los números como texto para poder dejarlos vacíos mientras se escribe.
type Draft = {
  id: string
  isNew: boolean
  name: string
  category: string
  brand: string
  indication: string
  detail: string
  sizes: string
  price: string
  stock: string
  madeToMeasure: boolean
  bulky: boolean
  active: boolean
  kind?: Product['kind']
  media: Media[]
}

const ACCESS_ERRORS = ['unauthorized', 'admin_not_configured', 'db_not_configured']
const INPUT = 'w-full rounded-lg border border-line bg-bg px-3 py-2.5'
const LABEL = 'flex flex-col gap-1 text-[13px] font-semibold'
const CHECK = 'flex items-center gap-2 text-sm'

const toDraft = (p: Item): Draft => ({
  id: p.id,
  isNew: false,
  name: p.name,
  category: p.category,
  brand: p.brand,
  indication: p.indication,
  detail: p.detail,
  sizes: p.sizes?.join(', ') ?? '',
  price: String(p.price),
  stock: String(p.stock),
  madeToMeasure: Boolean(p.madeToMeasure),
  bulky: Boolean(p.bulky),
  active: p.active,
  kind: p.kind,
  media: p.media ?? [],
})

const emptyDraft = (): Draft => ({
  id: '',
  isNew: true,
  name: '',
  category: '',
  brand: '',
  indication: '',
  detail: '',
  sizes: '',
  price: '',
  stock: '1',
  madeToMeasure: false,
  bulky: false,
  active: true,
  media: [],
})

// "Faja lumbar con ballenas" → "faja-lumbar-con-ballenas-3f9a", para que no choque con otro producto.
function newId(name: string) {
  const slug = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
  return `${slug || 'producto'}-${Math.random().toString(16).slice(2, 6)}`
}

// Achica la foto a 1600 px como máximo y la pasa a JPEG, así sube rápido desde el celular.
async function shrink(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob'))), 'image/jpeg', 0.85))
}

const thumb = (p: { media?: Media[] }) => {
  const m = p.media?.find((x) => x.type === 'image' || (x.type === 'video' && x.poster))
  return m?.type === 'image' ? m.src : m?.type === 'video' ? m.poster : undefined
}

interface Props {
  password: string
  /** Errores de acceso (contraseña o configuración): los muestra el panel y puede cerrar la sesión. */
  onError: (code: string) => void
}

export function AdminProducts({ password, onError }: Props) {
  const [products, setProducts] = useState<Item[] | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [notice, setNotice] = useState('')
  const [loadError, setLoadError] = useState(false)

  const call = useCallback(
    async (path: string, init: RequestInit = {}) => {
      const res = await fetch(path, { ...init, headers: { ...init.headers, Authorization: `Bearer ${password}` } }).catch(() => null)
      const data = await res?.json().catch(() => ({ error: 'server' }))
      if (ACCESS_ERRORS.includes(data?.error)) onError(data.error)
      return { ok: Boolean(res?.ok), data }
    },
    [password, onError],
  )

  useEffect(() => {
    call('/api/admin-products').then(({ ok, data }) => (ok ? setProducts(data.products) : setLoadError(true)))
  }, [call])

  async function move(index: number, delta: number) {
    if (!products) return
    const next = [...products]
    const [item] = next.splice(index, 1)
    next.splice(index + delta, 0, item)
    setProducts(next)
    const { ok } = await call('/api/admin-products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: next.map((p) => p.id) }),
    })
    if (!ok) setProducts(products)
  }

  if (draft)
    return (
      <Editor
        draft={draft}
        categories={[...new Set(products?.map((p) => p.category))]}
        call={call}
        onCancel={() => setDraft(null)}
        onSaved={(saved) => {
          setProducts((list) => (draft.isNew ? [...(list ?? []), saved] : (list ?? []).map((p) => (p.id === saved.id ? saved : p))))
          setDraft(null)
          setNotice(`Guardado “${saved.name}”. En la tienda se ve en menos de un minuto.`)
        }}
        onDeleted={(id) => {
          setProducts((list) => list?.filter((p) => p.id !== id) ?? null)
          setDraft(null)
          setNotice('Producto borrado.')
        }}
      />
    )

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm text-muted">
          {products ? `${products.length} productos` : loadError ? 'No pudimos cargar los productos. Probá con Actualizar.' : 'Cargando…'}
        </span>
        <button className="btn-primary w-auto px-5" onClick={() => setDraft(emptyDraft())}>
          Agregar producto
        </button>
      </div>
      {notice && <div className="rounded-[10px] border border-line bg-surface px-3.5 py-3 text-sm">{notice}</div>}
      <ul className="flex flex-col overflow-hidden rounded-xl border border-line bg-surface">
        {products?.map((p, i) => {
          const src = thumb(p)
          return (
            <li
              key={p.id}
              className="grid grid-cols-[56px_minmax(0,1fr)] items-center gap-x-3 gap-y-2 border-b border-line px-3 py-2.5 last:border-b-0 sm:grid-cols-[56px_minmax(0,1fr)_auto]"
            >
              <div className="grid size-14 place-items-center overflow-hidden rounded-lg bg-bg [&>svg]:w-4/5">
                {src ? <img src={src} alt="" className="size-full object-cover" /> : <ProductArt product={p} />}
              </div>
              <button className="min-w-0 text-left" onClick={() => setDraft(toDraft(p))}>
                <div className="truncate font-semibold">{p.name}</div>
                <div className="text-[13px] text-muted">
                  {p.category} · {ars(p.price)} · {p.madeToMeasure ? 'A medida' : p.stock < 1 ? <b className="text-warn">Sin stock</b> : `Stock ${p.stock}`}
                  {!p.active && <b className="ml-1.5 rounded border border-line px-1.5 text-[11.5px]">Oculto</b>}
                </div>
              </button>
              <div className="col-span-2 flex items-center justify-end gap-1 sm:col-span-1">
                <button className="btn-ghost px-2.5 py-1.5 text-sm" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Subir ${p.name}`}>
                  ↑
                </button>
                <button
                  className="btn-ghost px-2.5 py-1.5 text-sm"
                  onClick={() => move(i, 1)}
                  disabled={i === products.length - 1}
                  aria-label={`Bajar ${p.name}`}
                >
                  ↓
                </button>
                <button className="btn-ghost px-3 py-1.5 text-sm" onClick={() => setDraft(toDraft(p))}>
                  Editar
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

interface EditorProps {
  draft: Draft
  categories: string[]
  call: (path: string, init?: RequestInit) => Promise<{ ok: boolean; data: Record<string, unknown> }>
  onCancel: () => void
  onSaved: (p: Item) => void
  onDeleted: (id: string) => void
}

function Editor({ draft: initial, categories, call, onCancel, onSaved, onDeleted }: EditorProps) {
  const [d, setD] = useState(initial)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setD((x) => ({ ...x, [key]: value }))

  async function upload(files: FileList) {
    setError('')
    for (const [i, file] of [...files].entries()) {
      setBusy(`Subiendo foto ${i + 1} de ${files.length}…`)
      let body: Blob
      try {
        body = await shrink(file)
      } catch {
        setError(`No pudimos leer “${file.name}”. Probá con una foto JPG o PNG.`)
        continue
      }
      const { ok, data } = await call('/api/admin-upload', { method: 'POST', headers: { 'Content-Type': 'image/jpeg' }, body })
      if (!ok) {
        setError(data?.error === 'blob_not_configured' ? 'Falta conectar el almacenamiento de fotos en Vercel (Storage > Blob).' : 'No se pudo subir la foto.')
        break
      }
      setD((x) => ({ ...x, media: [...x.media, { type: 'image', src: String(data.url), alt: x.name }] }))
    }
    setBusy('')
  }

  function moveMedia(i: number) {
    setD((x) => {
      const media = [...x.media]
      ;[media[i - 1], media[i]] = [media[i], media[i - 1]]
      return { ...x, media }
    })
  }

  async function save() {
    setError('')
    const price = Number(d.price)
    const stock = d.madeToMeasure ? 99 : Number(d.stock || 0)
    const product: Item = {
      id: d.isNew ? newId(d.name) : d.id,
      active: d.active,
      name: d.name,
      category: d.category,
      brand: d.brand,
      indication: d.indication,
      detail: d.detail,
      sizes: d.sizes
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      madeToMeasure: d.madeToMeasure,
      bulky: d.bulky,
      price,
      stock,
      kind: d.kind,
      media: d.media,
    }
    setBusy('Guardando…')
    const { ok, data } = await call('/api/admin-products', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(product) })
    setBusy('')
    if (ok) onSaved({ ...(data.product as Item) })
    else setError(typeof data?.message === 'string' ? data.message : 'No se pudo guardar. Probá de nuevo.')
  }

  async function remove() {
    if (!window.confirm(`¿Borrar “${d.name}”? No se puede deshacer. Si solo querés sacarlo de la tienda por un tiempo, destildá “Visible en la tienda”.`))
      return
    setBusy('Borrando…')
    const { ok } = await call(`/api/admin-products?id=${encodeURIComponent(d.id)}`, { method: 'DELETE' })
    setBusy('')
    if (ok) onDeleted(d.id)
    else setError('No se pudo borrar.')
  }

  return (
    <form
      className="panel mx-auto w-full max-w-2xl"
      onSubmit={(e) => {
        e.preventDefault()
        save()
      }}
    >
      <h2 className="panel-title">{d.isNew ? 'Nuevo producto' : 'Editar producto'}</h2>

      <label className={LABEL}>
        Nombre
        <input className={INPUT} value={d.name} onChange={(e) => set('name', e.target.value)} required maxLength={120} />
      </label>
      <div className="grid gap-3.5 sm:grid-cols-2">
        <label className={LABEL}>
          Categoría
          <input
            className={INPUT}
            value={d.category}
            onChange={(e) => set('category', e.target.value)}
            list="admin-categories"
            maxLength={40}
            placeholder="Ej. Fajas y soportes"
          />
          <datalist id="admin-categories">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </label>
        <label className={LABEL}>
          Marca
          <input className={INPUT} value={d.brand} onChange={(e) => set('brand', e.target.value)} maxLength={60} />
        </label>
        <label className={LABEL}>
          Precio en pesos
          <input
            className={INPUT}
            value={d.price}
            onChange={(e) => set('price', e.target.value.replace(/\D/g, ''))}
            inputMode="numeric"
            required
            placeholder="Ej. 32500"
          />
        </label>
        {!d.madeToMeasure && (
          <label className={LABEL}>
            Stock (unidades)
            <input className={INPUT} value={d.stock} onChange={(e) => set('stock', e.target.value.replace(/\D/g, ''))} inputMode="numeric" />
          </label>
        )}
      </div>
      <label className={LABEL}>
        Talles, separados por coma
        <input className={INPUT} value={d.sizes} onChange={(e) => set('sizes', e.target.value)} placeholder="Ej. S, M, L, XL (vacío si no tiene talles)" />
      </label>
      <label className={LABEL}>
        Para qué sirve
        <textarea className={INPUT} rows={2} value={d.indication} onChange={(e) => set('indication', e.target.value)} maxLength={300} />
      </label>
      <label className={LABEL}>
        Características
        <textarea className={INPUT} rows={2} value={d.detail} onChange={(e) => set('detail', e.target.value)} maxLength={300} />
      </label>

      <div className="flex flex-col gap-2">
        <label className={CHECK}>
          <input type="checkbox" checked={d.active} onChange={(e) => set('active', e.target.checked)} /> Visible en la tienda
        </label>
        <label className={CHECK}>
          <input type="checkbox" checked={d.madeToMeasure} onChange={(e) => set('madeToMeasure', e.target.checked)} /> Se hace a medida (no usa stock)
        </label>
        <label className={CHECK}>
          <input type="checkbox" checked={d.bulky} onChange={(e) => set('bulky', e.target.checked)} /> Es voluminoso (el envío va en auto)
        </label>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-semibold">Fotos (la primera es la portada)</span>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-2">
          {d.media.map((m, i) => (
            <div key={`${i}-${m.type === 'youtube' ? m.id : m.src}`} className="relative aspect-square overflow-hidden rounded-lg border border-line bg-bg">
              {m.type === 'image' ? (
                <img src={m.src} alt="" className="size-full object-cover" />
              ) : (
                <span className="grid size-full place-items-center text-xs text-muted">Video</span>
              )}
              <div className="absolute inset-x-1 bottom-1 flex justify-between">
                {i > 0 ? (
                  <button type="button" className="rounded-full bg-surface px-2 text-sm shadow" onClick={() => moveMedia(i)} aria-label="Mover antes">
                    ←
                  </button>
                ) : (
                  <span />
                )}
                <button
                  type="button"
                  className="rounded-full bg-surface px-2 text-sm shadow"
                  onClick={() =>
                    set(
                      'media',
                      d.media.filter((_, j) => j !== i),
                    )
                  }
                  aria-label="Quitar foto"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
          <label className="grid aspect-square cursor-pointer place-items-center rounded-lg border border-dashed border-line text-center text-[13px] text-muted">
            + Agregar fotos
            <input
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              disabled={Boolean(busy)}
              onChange={(e) => {
                if (e.target.files?.length) upload(e.target.files)
                e.target.value = ''
              }}
            />
          </label>
        </div>
      </div>

      {error && <span className="text-sm text-warn">{error}</span>}
      {busy && (
        <span className="text-sm text-muted">
          <span className="spinner" />
          {busy}
        </span>
      )}

      <div className="flex flex-wrap gap-2">
        <button className="btn-primary w-auto flex-1" disabled={Boolean(busy)}>
          Guardar
        </button>
        <button type="button" className="btn-ghost" onClick={onCancel} disabled={Boolean(busy)}>
          Cancelar
        </button>
        {!d.isNew && (
          <button type="button" className="btn-ghost text-warn" onClick={remove} disabled={Boolean(busy)}>
            Borrar
          </button>
        )}
      </div>
    </form>
  )
}
