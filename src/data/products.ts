export type ProductKind =
  | 'splint'
  | 'stocking'
  | 'toiletRiser'
  | 'commode'
  | 'afo'
  | 'insole'
  | 'walker'
  | 'crutch'
  | 'wheelchair'
  | 'lumbar'
  | 'knee'
  | 'collar'

// Fotos y videos del producto. Los archivos van en public/productos/<id>/.
// Si un producto no tiene media, se muestra la ilustración genérica.
export type Media =
  | { type: 'image'; src: string; alt?: string }
  | { type: 'video'; src: string; poster?: string }
  | { type: 'youtube'; id: string; title?: string }

export interface Product {
  id: string
  category: string
  name: string
  brand: string
  /** Para qué se usa, en palabras del paciente. También se usa en el buscador. */
  indication: string
  /** Material, medidas o presentación. */
  detail: string
  sizes?: string[]
  /** Se fabrica a medida: después de la compra se coordina la toma de molde o medidas. */
  madeToMeasure?: boolean
  /** No entra en una moto: el envío se cotiza en auto. */
  bulky?: boolean
  price: number
  stock: number
  kind: ProductKind
  media?: Media[]
}

// Catálogo de ejemplo para la demo. Más adelante viene de la base de datos.
export const PRODUCTS: Product[] = [
  {
    id: 'plantillas-a-medida', category: 'Plantillas', name: 'Plantillas termomoldeadas personalizadas', brand: 'Taller propio',
    indication: 'Pie plano, pie cavo, fascitis plantar, espolón calcáneo y dolor al caminar',
    detail: 'EVA de alta densidad con forro antibacterial, moldeadas sobre tu pisada',
    madeToMeasure: true, price: 48500, stock: 99, kind: 'insole',
    media: [
      { type: 'image', src: '/productos/plantillas-a-medida/vista-superior.svg', alt: 'Vista superior de la plantilla' },
      { type: 'image', src: '/productos/plantillas-a-medida/vista-lateral.svg', alt: 'Vista lateral con el arco' },
      { type: 'video', src: '/productos/plantillas-a-medida/video.mp4', poster: '/productos/plantillas-a-medida/video-poster.jpg' },
      { type: 'image', src: '/productos/plantillas-a-medida/proceso.svg', alt: 'Cómo es el proceso a medida' },
    ],
  },
  {
    id: 'ferula-termomoldeada', category: 'Férulas y ortesis', name: 'Férula termomoldeada de muñeca y mano', brand: 'Taller propio',
    indication: 'Túnel carpiano, tendinitis, postoperatorio y fracturas estables de muñeca',
    detail: 'Termoplástico de baja temperatura con cierres de abrojo',
    madeToMeasure: true, price: 62000, stock: 99, kind: 'splint',
  },
  {
    id: 'ortesis-bajo-molde', category: 'Férulas y ortesis', name: 'Ortesis termoplástica bajo molde de yeso (AFO)', brand: 'Taller propio',
    indication: 'Pie caído, secuelas de ACV y lesiones neurológicas que afectan la marcha',
    detail: 'Polipropileno sobre molde de yeso tomado en el local',
    madeToMeasure: true, price: 185000, stock: 99, kind: 'afo',
  },
  {
    id: 'medias-compresion', category: 'Compresión', name: 'Medias de compresión 20-30 mmHg hasta la rodilla', brand: 'Venosan',
    indication: 'Várices, piernas cansadas, edema y viajes largos',
    detail: 'Compresión graduada, punta abierta, color natural',
    sizes: ['S', 'M', 'L', 'XL'], price: 39900, stock: 24, kind: 'stocking',
  },
  {
    id: 'rodillera-estabilizadores', category: 'Fajas y soportes', name: 'Rodillera con estabilizadores laterales', brand: 'Ortomed',
    indication: 'Esguince de ligamentos, inestabilidad de rodilla y deporte',
    detail: 'Neoprene con ballenas laterales y rótula abierta',
    sizes: ['S', 'M', 'L', 'XL'], price: 27800, stock: 18, kind: 'knee',
  },
  {
    id: 'faja-lumbar', category: 'Fajas y soportes', name: 'Faja lumbar con ballenas', brand: 'Ortomed',
    indication: 'Lumbalgia, hernia de disco y esfuerzos al levantar peso',
    detail: 'Elástico respirable con 4 ballenas posteriores y doble ajuste',
    sizes: ['M', 'L', 'XL', 'XXL'], price: 32500, stock: 4, kind: 'lumbar',
  },
  {
    id: 'cuello-philadelphia', category: 'Fajas y soportes', name: 'Collar cervical tipo Philadelphia', brand: 'Ortomed',
    indication: 'Inmovilización cervical por esguince o postoperatorio',
    detail: 'Espuma rígida en dos piezas con apoyo mentoniano',
    sizes: ['S', 'M', 'L'], price: 24900, stock: 9, kind: 'collar',
  },
  {
    id: 'suplemento-inodoro', category: 'Baño', name: 'Suplemento elevador de inodoro 10 cm', brand: 'Silfab',
    indication: 'Postoperatorio de cadera o rodilla y dificultad para sentarse',
    detail: 'Polipropileno con tapa, se fija sin herramientas, soporta 120 kg',
    price: 34900, stock: 11, kind: 'toiletRiser',
  },
  {
    id: 'inodoro-portatil', category: 'Baño', name: 'Inodoro portátil con apoyabrazos', brand: 'Silfab',
    indication: 'Uso junto a la cama para personas con movilidad reducida',
    detail: 'Estructura de aluminio con balde extraíble y altura regulable',
    bulky: true, price: 89900, stock: 3, kind: 'commode',
  },
  {
    id: 'andador-plegable', category: 'Movilidad', name: 'Andador plegable de aluminio', brand: 'Silfab',
    indication: 'Rehabilitación, adultos mayores y apoyo al caminar',
    detail: 'Regulable en altura de 78 a 95 cm, pesa 2,4 kg, soporta 100 kg',
    bulky: true, price: 69500, stock: 7, kind: 'walker',
  },
  {
    id: 'baston-canadiense', category: 'Movilidad', name: 'Bastón canadiense regulable (par)', brand: 'Silfab',
    indication: 'Descarga de peso por fracturas, esguinces o cirugías de pierna',
    detail: 'Aluminio con puño anatómico y regatón antideslizante',
    price: 42800, stock: 15, kind: 'crutch',
  },
  {
    id: 'silla-ruedas', category: 'Movilidad', name: 'Silla de ruedas plegable estándar', brand: 'Silfab',
    indication: 'Traslados de personas con movilidad reducida, en casa o en la calle',
    detail: 'Asiento de 46 cm, apoyapiés rebatibles, ruedas macizas de 24"',
    bulky: true, price: 349000, stock: 2, kind: 'wheelchair',
  },
]

export const CATEGORIES = ['Todos', ...new Set(PRODUCTS.map((p) => p.category))]

export const findProduct = (id: string) => PRODUCTS.find((p) => p.id === id)

// En el carrito cada línea se identifica por producto y talle: "faja-lumbar::L".
export const cartKey = (id: string, size?: string) => (size ? `${id}::${size}` : id)
export function parseCartKey(key: string) {
  const [id, size] = key.split('::')
  return { product: findProduct(id), size }
}
