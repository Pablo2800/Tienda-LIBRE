import { STORE, whatsappLink } from '../data/store'

interface Props {
  categories: string[]
  onCategory: (c: string) => void
  onRevocation: () => void
}

const HEAD = 'mb-3 font-condensed text-[15px] font-semibold tracking-[0.1em] uppercase'
const LINK = 'text-left text-muted hover:text-ink hover:underline'

export function Footer({ categories, onCategory, onRevocation }: Props) {
  const chat = whatsappLink('Hola, tengo una consulta.')
  return (
    <footer className="border-t border-line bg-bg text-[14px]">
      <div className="wrap grid gap-8 py-10 sm:grid-cols-2 md:grid-cols-4">
        <div className="flex flex-col items-start gap-3">
          <img src="/logo-libre.png" alt={STORE.name} width="361" height="128" className="h-10 w-auto dark:invert" />
          <p className="font-condensed text-[16px] font-semibold tracking-[0.08em] uppercase">Productos pensados para tu recuperación</p>
          {chat && (
            <a className="btn-outline hover:bg-ink hover:text-bg" href={chat} target="_blank" rel="noreferrer">
              Escribinos por WhatsApp
            </a>
          )}
        </div>
        <nav aria-label="Categorías">
          <h3 className={HEAD}>Productos</h3>
          <ul className="flex flex-col gap-1.5">
            {categories
              .filter((c) => c !== 'Todos')
              .map((c) => (
                <li key={c}>
                  <button className={LINK} onClick={() => onCategory(c)}>
                    {c}
                  </button>
                </li>
              ))}
          </ul>
        </nav>
        <div>
          <h3 className={HEAD}>Ayuda</h3>
          <ul className="flex flex-col gap-1.5 text-muted">
            <li>Envíos en el día en Gran Mendoza, o retiro en el local</li>
            <li>Tarjetas de crédito, débito y Mercado Pago</li>
            <li>Precios en pesos argentinos, IVA incluido</li>
            <li>
              {/* Obligatorio para tiendas online (Resolución 424/2020): visible y de fácil acceso. */}
              <button className="mt-1 font-semibold text-ink underline" onClick={onRevocation}>
                Botón de arrepentimiento
              </button>
            </li>
          </ul>
        </div>
        <div>
          <h3 className={HEAD}>Contacto</h3>
          <ul className="flex flex-col gap-1.5 text-muted">
            <li>{STORE.address}</li>
            <li>Atención {STORE.hours}</li>
            {chat && (
              <li>
                <a className={LINK} href={chat} target="_blank" rel="noreferrer">
                  WhatsApp +{STORE.whatsapp}
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>
      <div className="border-t border-line py-4 text-center text-[12.5px] text-muted">
        © {new Date().getFullYear()} {STORE.name}. Todos los derechos reservados.
      </div>
    </footer>
  )
}
