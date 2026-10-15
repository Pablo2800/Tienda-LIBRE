import { useEffect, useState } from 'react'

interface Props {
  orderId: string
  customerName: string
  delivery: { street: string; zone: string; vehicle: 'moto' | 'auto' } | null
  hasCustom: boolean
  onFinish: () => void
}

const MOTO_STEPS = ['Pago aprobado', 'Pedido preparado en el local', 'Repartidor asignado', 'Repartidor retiró el pedido', 'En camino a tu domicilio', 'Entregado']
const PICKUP_STEPS = ['Pago aprobado', 'Pedido preparado en el local', 'Listo para retirar']

// En la versión real cada paso llega por webhook del servicio de envíos. Acá avanza solo para mostrar el flujo.
export function OrderTracking({ orderId, customerName, delivery, hasCustom, onFinish }: Props) {
  const steps = delivery ? MOTO_STEPS : PICKUP_STEPS
  const [progress, setProgress] = useState(1)
  const [start] = useState(() => Date.now())

  useEffect(() => {
    if (progress >= steps.length - 1) return
    const t = setTimeout(() => setProgress((p) => p + 1), 2600)
    return () => clearTimeout(t)
  }, [progress, steps.length])

  const time = (i: number) => new Date(start + i * 4 * 60000).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="panel">
      <h3 className="panel-title">¡Gracias, {customerName.split(' ')[0] || 'listo'}!</h3>
      <p>
        Pedido <span className="rounded-md border border-line bg-bg px-2 py-0.5 font-mono text-[13px]">#{orderId}</span>.{' '}
        {delivery ? `Lo enviamos a ${delivery.street}, ${delivery.zone}.` : 'Te esperamos en el local.'}
      </p>
      {hasCustom && (
        <div className="quote">
          <b>Tu pedido incluye un producto a medida</b>
          <span>Te escribimos por WhatsApp para coordinar la toma de molde en el local. Los productos a medida se entregan cuando están listos, en 7 a 10 días hábiles.</span>
        </div>
      )}
      <div className="my-1 flex flex-col">
        {steps.map((s, i) => (
          <div key={s} className={`grid grid-cols-[22px_minmax(0,1fr)_auto] items-start gap-3 py-2.5 ${i > progress ? 'text-muted' : ''}`}>
            <span
              className={`mt-1 ml-1 size-3.5 rounded-full border-2 ${
                i < progress ? 'border-ok bg-ok' : i === progress ? 'border-accent bg-surface ring-4 ring-accent-soft' : 'border-line bg-surface'
              }`}
            />
            <span>
              {s}
              {delivery && i === 2 && progress >= 2 && (
                <>
                  <br />
                  <span className="hint">{delivery.vehicle === 'auto' ? 'Martín · Fiat Fiorino blanca · patente AB123CD (ejemplo)' : 'Martín · Moto Honda Wave · patente A123BCD (ejemplo)'}</span>
                </>
              )}
            </span>
            <span className="font-mono text-xs text-muted">{i <= progress ? time(i) : ''}</span>
          </div>
        ))}
      </div>
      <span className="hint">
        {delivery
          ? 'En la versión real cada paso llega por webhook del servicio de envíos y se le avisa al cliente por email o WhatsApp. Acá avanza solo para mostrar el flujo.'
          : 'En la versión real se avisa al cliente por email cuando está listo.'}
      </span>
      <button className="btn-ghost" onClick={onFinish}>
        Volver a la tienda
      </button>
    </div>
  )
}
