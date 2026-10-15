// Marca de ejemplo: una cruz redondeada, hasta tener el logo del cliente.
export function BrandMark() {
  return (
    <svg className="size-[22px] flex-none" viewBox="0 0 22 22" aria-hidden="true">
      <rect x="7" y="1" width="8" height="20" rx="3" fill="var(--accent)" />
      <rect x="1" y="7" width="20" height="8" rx="3" fill="var(--accent)" />
      <circle cx="11" cy="11" r="2.6" fill="var(--warm)" />
    </svg>
  )
}
