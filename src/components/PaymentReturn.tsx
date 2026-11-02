import { useEffect, useRef, useState } from 'react'
import { clearPendingOrder, loadPendingOrder } from '../lib/pendingOrder'
import { BrandMark } from './BrandMark'
import { OrderConfirmation } from './OrderConfirmation'

type Status = 'checking' | 'approved' | 'pending' | 'rejected' | 'error'

// Pantalla a la que vuelve el cliente desde Mercado Pago (?pedido=...&payment_id=...).
// El estado del pago se confirma con el servidor, no con lo que dice la URL.
export function PaymentReturn({ orderId, paymentId, onApproved, onClose }: { orderId: string; paymentId: string | null; onApproved: () => void; onClose: () => void }) {
  const [status, setStatus] = useState<Status>('checking')
  const [order] = useState(() => loadPendingOrder(orderId))
  // Se guarda en un ref para que vaciar el carrito no vuelva a disparar la consulta.
  const approvedRef = useRef(onApproved)
  approvedRef.current = onApproved

  useEffect(() => {
    if (!paymentId) {
      setStatus('rejected')
      return
    }
    let cancelled = false
    fetch(`/api/order?pedido=${encodeURIComponent(orderId)}&payment_id=${encodeURIComponent(paymentId)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data: { status: string }) => {
        if (cancelled) return
        if (data.status === 'approved') {
          setStatus('approved')
          clearPendingOrder()
          approvedRef.current()
        } else if (data.status === 'pending' || data.status === 'in_process' || data.status === 'authorized') setStatus('pending')
        else setStatus('rejected')
      })
      .catch(() => !cancelled && setStatus('error'))
    return () => {
      cancelled = true
    }
  }, [orderId, paymentId])

  return (
    <section className="fixed inset-0 z-[60] overflow-auto bg-bg pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]" role="dialog" aria-modal="true" aria-label="Estado del pago">
      <div className="border-b border-line bg-surface px-[18px] py-4">
        <div className="mx-auto flex w-full max-w-[720px] items-center gap-2 font-display text-lg font-bold">
          <BrandMark />
          Tu pedido
        </div>
      </div>
      <div className="wrap max-w-[720px] pt-6 pb-12">
        {status === 'checking' && (
          <div className="panel">
            <span>
              <span className="spinner text-accent" />
              Confirmando el pago con Mercado Pago…
            </span>
          </div>
        )}
        {status === 'approved' && (
          <OrderConfirmation
            orderId={orderId}
            customerName={order?.name ?? ''}
            delivery={order?.delivery ? { street: order.street, zone: order.zone } : null}
            hasCustom={order?.hasCustom ?? false}
            onFinish={onClose}
          />
        )}
        {status !== 'checking' && status !== 'approved' && (
          <div className="panel">
            <h3 className="panel-title">
              {status === 'pending' ? 'Tu pago está pendiente' : status === 'rejected' ? 'El pago no se completó' : 'No pudimos confirmar el pago'}
            </h3>
            <p className="text-muted">
              {status === 'pending'
                ? `Mercado Pago todavía está procesando el pago del pedido #${orderId}. Te avisamos por WhatsApp cuando se acredite.`
                : status === 'rejected'
                  ? 'No se cobró nada. Tu carrito sigue guardado para que lo intentes de nuevo.'
                  : `Si el pago se debitó, escribinos con el número de pedido #${orderId}.`}
            </p>
            <button className="btn-primary" onClick={onClose}>
              Volver a la tienda
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
