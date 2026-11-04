import { whatsappLink } from '../data/store'

// Franja de beneficios debajo del banner: ícono en un círculo y dos líneas de texto.
const ICON = {
  width: 30,
  height: 30,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

const ITEMS: { title: string; text: string; icon: React.ReactNode; href?: string }[] = [
  {
    title: 'Envío en el día',
    text: 'en Gran Mendoza',
    icon: (
      <svg {...ICON}>
        <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7" />
        <circle cx="7" cy="17.5" r="1.8" />
        <circle cx="17" cy="17.5" r="1.8" />
      </svg>
    ),
  },
  {
    title: 'Hecho a medida',
    text: 'en nuestro taller',
    icon: (
      <svg {...ICON}>
        <path d="M9 21c-3 0-4-3-3.5-7S7 5 10 3.5c2.5-1 4.5 1 4 4-.4 2.6-1.4 4.5-1.4 7.5 0 3.5-1 6-3.6 6z" />
        <path d="M9.5 15c-.6-2 0-5 1.5-7" />
      </svg>
    ),
  },
  {
    title: 'Medios de pago',
    text: 'tarjetas y Mercado Pago',
    icon: (
      <svg {...ICON}>
        <rect x="3" y="5.5" width="18" height="13" rx="2" />
        <path d="M3 10h18M7 15h4" />
      </svg>
    ),
  },
  {
    title: 'Consultas',
    text: 'por WhatsApp',
    href: whatsappLink('Hola, tengo una consulta.'),
    icon: (
      <svg {...ICON}>
        <path d="M4 20l1.3-3.9A8 8 0 1 1 8 18.8z" />
        <path d="M9 10h6M9 13h4" />
      </svg>
    ),
  },
]

export function Benefits() {
  return (
    <section className="border-b border-line bg-bg">
      <ul className="wrap grid grid-cols-2 gap-x-4 gap-y-6 py-8 md:grid-cols-4">
        {ITEMS.map((b) => {
          const body = (
            <>
              <span className="grid size-[72px] flex-none place-items-center rounded-full bg-surface text-ink shadow-[0_2px_10px_rgba(0,0,0,0.06)] md:size-20">
                {b.icon}
              </span>
              <span className="flex flex-col font-condensed text-[15px] leading-tight tracking-[0.08em] uppercase">
                <b className="font-semibold">{b.title}</b>
                <span className="text-muted">{b.text}</span>
                <span className="mt-2 h-0.5 w-6 bg-ink" />
              </span>
            </>
          )
          return (
            <li key={b.title}>
              {b.href ? (
                <a className="flex flex-col items-center gap-3 text-center md:flex-row md:text-left" href={b.href} target="_blank" rel="noreferrer">
                  {body}
                </a>
              ) : (
                <div className="flex flex-col items-center gap-3 text-center md:flex-row md:text-left">{body}</div>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
