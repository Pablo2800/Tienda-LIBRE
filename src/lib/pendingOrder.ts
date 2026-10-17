// Datos del pedido que se guardan en el navegador antes de ir a Mercado Pago,
// para mostrar el seguimiento cuando el cliente vuelve a la tienda.
export type PendingOrder = {
  orderId: string
  name: string
  street: string
  zone: string
  vehicle: 'moto' | 'auto'
  delivery: boolean
  hasCustom: boolean
}

const KEY = 'ortopedia-pedido'

export function savePendingOrder(order: PendingOrder) {
  try {
    localStorage.setItem(KEY, JSON.stringify(order))
  } catch {
    // Sin almacenamiento: al volver se muestra el estado del pago sin los datos de entrega.
  }
}

export function loadPendingOrder(orderId: string): PendingOrder | null {
  try {
    const order = JSON.parse(localStorage.getItem(KEY) ?? 'null') as PendingOrder | null
    return order?.orderId === orderId ? order : null
  } catch {
    return null
  }
}

export function clearPendingOrder() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // nada que limpiar
  }
}
