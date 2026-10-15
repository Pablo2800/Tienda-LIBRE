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
      <h3>¡Gracias, {customerName.split(' ')[0] || 'listo'}!</h3>
      <p style={{ margin: 0 }}>
        Pedido <span className="order-id">#{orderId}</span>.{' '}
        {delivery ? `Lo enviamos a ${delivery.street}, ${delivery.zone}.` : 'Te esperamos en el local.'}
      </p>
      {hasCustom && (
        <div className="quote">
          <b>Tu pedido incluye un producto a medida</b>
          <span>Te escribimos por WhatsApp para coordinar la toma de molde en el local. Los productos a medida se entregan cuando están listos, en 7 a 10 días hábiles.</span>
        </div>
      )}
      <div className="track">
        {steps.map((s, i) => (
          <div key={s} className={`ts ${i < progress ? 'done' : i === progress ? 'now' : 'pending'}`}>
            <span className="b" />
            <span>
              {s}
              {delivery && i === 2 && progress >= 2 && (
                <>
                  <br />
                  <span className="hint">{delivery.vehicle === 'auto' ? 'Martín · Fiat Fiorino blanca · patente AB123CD (ejemplo)' : 'Martín · Moto Honda Wave · patente A123BCD (ejemplo)'}</span>
                </>
              )}
            </span>
            <span className="tm">{i <= progress ? time(i) : ''}</span>
          </div>
        ))}
      </div>
      <span className="hint">
        {delivery
          ? 'En la versión real cada paso llega por webhook del servicio de envíos y se le avisa al cliente por email o WhatsApp. Acá avanza solo para mostrar el flujo.'
          : 'En la versión real se avisa al cliente por email cuando está listo.'}
      </span>
      <button className="ghost" onClick={onFinish}>
        Volver a la tienda
      </button>
    </div>
  )
}
