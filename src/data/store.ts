// Datos del local que se muestran en la tienda. Cambiá acá y se actualiza en todos lados.
export const STORE = {
  name: 'LIBRE Salud Deportiva',
  /** Dirección del local, para retiro y el pie de página. */
  address: 'Av. San Martín 1200, Ciudad de Mendoza',
  hours: 'lun a sáb 9 a 19 h',
  /** WhatsApp del local con código de país, sin + ni espacios (ej. 5492615550123). Vacío: no se muestra el botón. */
  whatsapp: '',
}

/** Link para escribirle al local por WhatsApp con un mensaje ya cargado. */
export const whatsappLink = (text: string) => (STORE.whatsapp ? `https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(text)}` : '')
