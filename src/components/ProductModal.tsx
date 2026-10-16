import { useState } from 'react'
import type { Product } from '../data/products'
import { MediaCarousel } from './MediaCarousel'
import { Price } from './Price'
import { Stock } from './Stock'

interface Props {
  product: Product
  onClose: () => void
  onAdd: (size?: string) => void
}

export function ProductModal({ product: p, onClose, onAdd }: Props) {
  const [size, setSize] = useState<string>()
  const missingSize = Boolean(p.sizes?.length) && !size
  const specs: [string, string][] = [
    ['Indicado para', p.indication],
    ['Características', p.detail],
    ...(p.madeToMeasure
      ? [['Cómo es a medida', 'Después de la compra te escribimos por WhatsApp para coordinar la toma de molde o de medidas en el local.'] as [string, string]]
      : []),
    ['Envío', `${p.bulky ? 'En auto' : 'En moto'} en el día en Gran Mendoza, cotizado al ingresar tu dirección`],
  ]
  return (
    <>
      <div className="fixed inset-0 z-40 bg-[rgba(10,14,18,.45)]" />
      <div
        className="fixed inset-0 z-50 grid place-items-center py-4 pr-[max(16px,env(safe-area-inset-right))] pl-[max(16px,env(safe-area-inset-left))]"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div
          className="relative grid max-h-[calc(100%-32px)] w-full max-w-205 overflow-auto rounded-[14px] bg-surface shadow-modal md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]"
          role="dialog"
          aria-modal="true"
          aria-label={p.name}
        >
          <button className="btn-close absolute top-2.5 right-2.5 z-10 rounded-full bg-surface" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
          <MediaCarousel product={p} />
          <div className="flex min-w-0 flex-col gap-2.5 p-6">
            <span className="eyebrow">
              {p.category} · {p.brand}
            </span>
            <h2 className="font-display text-[26px] leading-[1.1] font-bold text-balance">{p.name}</h2>
            <Price product={p} className="text-[28px]" />
            <Stock product={p} detailed />
            <table className="w-full border-collapse text-[13.5px]">
              <tbody>
                {specs.map(([label, value]) => (
                  <tr key={label} className="border-b border-line align-top">
                    <td className="w-[42%] py-1.75 text-muted">{label}</td>
                    <td className="py-1.75">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {p.sizes?.length ? (
              <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Talle">
                <span className="mr-1 text-[13px] font-semibold">Talle</span>
                {p.sizes.map((s) => (
                  <button key={s} className="chip" aria-pressed={size === s} onClick={() => setSize(s)}>
                    {s}
                  </button>
                ))}
                <span className="hint basis-full">¿Dudas con el talle? Consultanos y te ayudamos a medir.</span>
              </div>
            ) : null}
            <button className="btn-primary" onClick={() => onAdd(size)} disabled={missingSize}>
              {missingSize ? 'Elegí un talle' : 'Agregar al carrito'}
            </button>
            <p className="hint">La información es orientativa y no reemplaza la indicación de tu médico o kinesiólogo.</p>
          </div>
        </div>
      </div>
    </>
  )
}
