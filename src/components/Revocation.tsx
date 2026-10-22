import { useState } from 'react'
import { STORE, whatsappLink } from '../data/store'

const INPUT = 'w-full rounded-lg border border-line bg-bg px-3 py-2.5'
const LABEL = 'flex flex-col gap-1 text-[13px] font-semibold'

// Botón de arrepentimiento (Resolución 424/2020): el cliente pide revocar la compra
// y recibe en el momento un código de revocación.
export function Revocation({ onClose }: { onClose: () => void }) {
  const [orderId, setOrderId] = useState('')
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [reason, setReason] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [code, setCode] = useState('')

  async function submit() {
    setSending(true)
    setError('')
    const res = await fetch('/api/arrepentimiento', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, name, contact, reason }),
    }).catch(() => null)
    const data = await res?.json().catch(() => null)
    setSending(false)
    if (res?.ok && data?.code) setCode(data.code)
    else {
      const chat = whatsappLink(`Hola, quiero arrepentirme de la compra${orderId ? ` del pedido #${orderId}` : ''}.`)
      setError(
        chat
          ? 'No pudimos registrar el pedido. Probá de nuevo o escribinos por WhatsApp.'
          : `No pudimos registrar el pedido. Probá de nuevo o acercate al local en ${STORE.address}.`,
      )
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-[rgba(10,14,18,.45)]" />
      <div
        className="fixed inset-0 z-50 grid place-items-center overflow-auto py-4 pr-[max(16px,env(safe-area-inset-right))] pl-[max(16px,env(safe-area-inset-left))]"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="panel relative w-full max-w-lg shadow-modal" role="dialog" aria-modal="true" aria-label="Botón de arrepentimiento">
          <button className="btn-close absolute top-2.5 right-2.5" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
          <h2 className="panel-title pr-8">Botón de arrepentimiento</h2>
          {code ? (
            <>
              <p>Recibimos tu pedido de arrepentimiento. Tu código de revocación es:</p>
              <p className="rounded-lg border border-line bg-bg px-3 py-3 text-center font-mono text-xl font-bold tracking-wider">{code}</p>
              <p className="text-muted">Guardalo. Te contactamos para coordinar la devolución del producto y el reintegro del dinero.</p>
              <button className="btn-primary" onClick={onClose}>
                Listo
              </button>
            </>
          ) : (
            <form
              className="flex flex-col gap-3"
              onSubmit={(e) => {
                e.preventDefault()
                submit()
              }}
            >
              <p className="text-sm text-muted">
                Podés arrepentirte de una compra online dentro de los 10 días corridos desde que recibiste el producto, sin dar explicaciones y sin costo. No
                aplica a productos hechos a medida.
              </p>
              <label className={LABEL}>
                Número de pedido (si lo tenés)
                <input className={INPUT} value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="Ej. 4986F0A4" maxLength={20} />
              </label>
              <label className={LABEL}>
                Nombre y apellido
                <input className={INPUT} value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} autoComplete="name" />
              </label>
              <label className={LABEL}>
                Teléfono o mail
                <input className={INPUT} value={contact} onChange={(e) => setContact(e.target.value)} required maxLength={120} />
              </label>
              <label className={LABEL}>
                Comentario (opcional)
                <textarea className={INPUT} rows={2} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} />
              </label>
              {error && <span className="text-sm text-warn">{error}</span>}
              <button className="btn-primary" disabled={sending || !name.trim() || !contact.trim()}>
                {sending ? 'Enviando…' : 'Enviar pedido de arrepentimiento'}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  )
}
