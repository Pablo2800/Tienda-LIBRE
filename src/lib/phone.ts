// Convierte el celular que escribió el cliente al formato que usa WhatsApp (549 + característica + número).
// Acepta las formas habituales: "261 466-7053", "0261 15 466 7053", "+54 9 261 4667053", "4667053".
// Sin característica se asume Mendoza (261). Devuelve null si no se puede interpretar.
export function waPhone(raw: string): string | null {
  let d = raw.replace(/\D/g, '').replace(/^00/, '')
  if (d.startsWith('54') && d.length >= 12) d = d.slice(2).replace(/^9/, '')
  d = d.replace(/^0/, '')
  // Número local sin característica, con o sin el 15.
  if (d.length === 9 && d.startsWith('15')) d = d.slice(2)
  if (d.length === 7) d = '261' + d
  // El 15 va después de la característica (de 2 a 4 dígitos).
  if (d.length === 12)
    for (const at of [3, 2, 4])
      if (d.slice(at, at + 2) === '15') {
        d = d.slice(0, at) + d.slice(at + 2)
        break
      }
  return d.length === 10 ? '549' + d : null
}
