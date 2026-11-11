import { whatsappLink } from '../data/store'
import { WhatsAppIcon } from './WhatsAppIcon'

// Botón flotante de WhatsApp abajo a la derecha: queda fijo aunque se haga scroll.
// Va debajo de los modales (carrito, checkout, detalle), así no tapa sus botones.
export function WhatsAppFloat() {
  const chat = whatsappLink('Hola, tengo una consulta.')
  if (!chat) return null
  return (
    <a
      href={chat}
      target="_blank"
      rel="noreferrer"
      aria-label="Escribinos por WhatsApp"
      title="Escribinos por WhatsApp"
      className="fixed right-[max(16px,env(safe-area-inset-right))] bottom-[calc(16px+env(safe-area-inset-bottom))] z-30 grid size-14 place-items-center rounded-full bg-[#25d366] text-white shadow-[0_6px_20px_rgba(0,0,0,0.25)] transition-transform hover:scale-110 md:right-6 md:bottom-6 md:size-16"
    >
      <WhatsAppIcon size={32} />
    </a>
  )
}
