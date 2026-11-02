import { STORE, whatsappLink } from '../data/store'

interface Props {
  orderId: string
  customerName: string
  delivery: { street: string; zone: string } | null
  hasCustom: boolean
  onFinish: () => void
}

// Confirmación después del pago: el número de pedido y cómo sigue la entrega.
export function OrderConfirmation({ orderId, customerName, delivery, hasCustom, onFinish }: Props) {
  const chat = whatsappLink(`Hola, hice el pedido #${orderId} en la tienda online.`)
  return (
    <div className="panel">
      <h3 className="panel-title">¡Gracias, {customerName.split(' ')[0] || 'listo'}! Recibimos tu pedido</h3>
      <p>
        Tu número de pedido es <span className="rounded-md border border-line bg-bg px-2 py-0.5 font-mono text-[13px]">#{orderId}</span>. Guardalo por cualquier
        consulta.
      </p>
      <p className="text-muted">
        {delivery
          ? `Te escribimos por WhatsApp al número que nos dejaste para coordinar el envío a ${delivery.street}, ${delivery.zone}.`
          : `Te avisamos por WhatsApp cuando esté listo para retirar en ${STORE.address} (${STORE.hours}).`}
      </p>
      {hasCustom && (
        <div className="quote">
          <b>Tu pedido incluye un producto a medida</b>
          <span>
            Te escribimos para coordinar la toma de molde o de medidas en el local. Los productos a medida se entregan cuando están listos, en 7 a 10 días
            hábiles.
          </span>
        </div>
      )}
      {chat && (
        <a className="btn-ghost text-center" href={chat} target="_blank" rel="noreferrer">
          Escribinos por WhatsApp
        </a>
      )}
      <button className="btn-primary" onClick={onFinish}>
        Volver a la tienda
      </button>
    </div>
  )
}
