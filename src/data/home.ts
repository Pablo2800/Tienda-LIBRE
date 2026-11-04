// Contenido de la portada. Cambiá textos, categorías o productos acá y se actualiza la home.

export type Slide = {
  /** Texto chico arriba del título. */
  eyebrow: string
  title: string
  text: string
  /** Categoría que se abre con el botón. */
  category: string
  /** Producto cuya foto se muestra (su id). Si no está, se usa el primero de la categoría. */
  product?: string
  /** Foto propia para el banner (por ejemplo /banners/plantillas.jpg en public/). Tiene prioridad sobre la del producto. */
  image?: string
}

export const HERO: Slide[] = [
  {
    eyebrow: 'Hecho en nuestro taller',
    title: 'Plantillas a medida',
    text: 'Termomoldeadas según tu pisada, para correr, entrenar o caminar sin dolor.',
    category: 'Plantillas',
    product: 'plantillas-a-medida',
  },
  {
    eyebrow: 'Recuperación',
    title: 'Fajas y soportes',
    text: 'Rodilleras, fajas lumbares y collares cervicales para volver a moverte con confianza.',
    category: 'Fajas y soportes',
    product: 'rodillera-estabilizadores',
  },
  {
    eyebrow: 'Envío en el día',
    title: 'Movilidad',
    text: 'Andadores, bastones y sillas de ruedas con envío en el día en Gran Mendoza.',
    category: 'Movilidad',
    product: 'andador-plegable',
  },
]

/** Mensaje de la franja superior. */
export const ANNOUNCEMENT = 'Envío en el día en Gran Mendoza | Pagá con tarjeta de crédito, débito o Mercado Pago'
