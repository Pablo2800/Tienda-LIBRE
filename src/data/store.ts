// Datos del local que se muestran en la tienda. Cambiá acá y se actualiza en todos lados.
export const STORE = {
  name: 'LIBRE Salud Deportiva',
  /** Dirección del local, para retiro y el pie de página. */
  address: 'Sarmiento 2445, Godoy Cruz, Mendoza',
  hours: 'lun a sáb 9 a 19 h',
  /** WhatsApp del local con código de país, sin + ni espacios (ej. 5492615550123). Vacío: no se muestra el botón. */
  whatsapp: '5492614667053',
  /**
   * Ubicación del local, para medir la distancia del envío. En Google Maps: clic derecho sobre el local
   * y clic en los números (ej. -32.9254, -68.8450) para copiarlos. Si queda vacía, se busca por la dirección.
   */
  location: { lat: -32.943773107343524, lng: -68.81648185933199 } as { lat: number; lng: number } | null,
  /**
   * Precio del envío: base + precio por km de recorrido, redondeado de a $50.
   * Para ajustarlo, simulá envíos en la app de Uber (opción Envíos) a 2 o 3 distancias y compará.
   * Ej.: con base 2000 y 480 por km, 3,1 km dan $3.500 (lo que cobra Uber), y con el recargo, $3.850.
   */
  shipping: {
    moto: { base: 2000, perKm: 480 },
    auto: { base: 3500, perKm: 900 },
    /** Más lejos que esto (km de recorrido) no se hacen envíos. */
    maxKm: 20,
    /** Recargo sobre la tarifa, porque el envío se pide a mano desde el local. 0.1 = 10% más. */
    markup: 0.1,
  },
}

/** Link para escribirle al local por WhatsApp con un mensaje ya cargado. */
export const whatsappLink = (text: string) => (STORE.whatsapp ? `https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(text)}` : '')
