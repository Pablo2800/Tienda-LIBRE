import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { searchAddress, type AddressSuggestion } from '../lib/addressSearch'

// Campo de calle y número con sugerencias. Elegir una completa la calle y el departamento;
// si no aparece la dirección, el cliente puede escribirla igual.
export function AddressInput({
  id,
  className,
  value,
  onChange,
  onPick,
}: {
  id: string
  className: string
  value: string
  onChange: (street: string) => void
  onPick: (s: AddressSuggestion) => void
}) {
  const listId = useId()
  const [items, setItems] = useState<AddressSuggestion[]>([])
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  // Después de elegir una sugerencia no se vuelve a buscar el mismo texto.
  const picked = useRef('')

  useEffect(() => {
    const q = value.trim()
    if (q.length < 3 || q === picked.current) {
      setItems([])
      return
    }
    const ctrl = new AbortController()
    const t = setTimeout(() => {
      searchAddress(q, ctrl.signal)
        .then((r) => {
          setItems(r)
          setActive(-1)
        })
        .catch(() => {}) // sin sugerencias: el campo sigue funcionando como texto libre
    }, 350)
    return () => {
      clearTimeout(t)
      ctrl.abort()
    }
  }, [value])

  const pick = (s: AddressSuggestion) => {
    picked.current = s.street
    onPick(s)
    setOpen(false)
    setItems([])
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (!open || !items.length) return
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => (i + (e.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length)
    } else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault()
      pick(items[active])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const show = open && items.length > 0
  return (
    <div className="relative">
      <input
        className={className}
        id={id}
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
        placeholder="Ej. Belgrano 1450"
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={show}
        aria-controls={listId}
        aria-activedescendant={show && active >= 0 ? `${listId}-${active}` : undefined}
      />
      {show && (
        <ul id={listId} role="listbox" className="absolute inset-x-0 top-full z-10 mt-1 overflow-hidden rounded-lg border border-line bg-surface shadow-modal">
          {items.map((s, i) => (
            <li
              key={`${s.street}|${s.zone}`}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              className="cursor-pointer px-3 py-2 aria-selected:bg-bg hover:bg-bg"
              // mousedown en vez de click: así se elige antes de que el campo pierda el foco y cierre la lista.
              onMouseDown={(e) => {
                e.preventDefault()
                pick(s)
              }}
            >
              <span className="block font-medium">{s.street}</span>
              <span className="block text-[12.5px] text-muted">{s.detail}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
