export type InkColor = 'c' | 'm' | 'y' | 'k'
export type ProductKind = 'toner' | 'drum' | 'ink' | 'bottle' | 'paper'

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
  fits: string
  yield: string
  price: number
  stock: number
  color: InkColor
  kind: ProductKind
  code: string
  media?: Media[]
}

// Catálogo de ejemplo para la demo. Más adelante viene de la base de datos.
export const PRODUCTS: Product[] = [
  { id: 'cf219a', category: 'Tambores', name: 'Unidad de imagen CF219A', brand: 'Genérico', fits: 'HP LaserJet Pro M102, M104, MFP M130, M132', yield: '12.000 págs.', price: 38900, stock: 14, color: 'k', kind: 'drum', code: 'CF219A',
    media: [
      { type: 'image', src: '/productos/cf219a/frente.svg', alt: 'Vista frontal' },
      { type: 'image', src: '/productos/cf219a/lateral.svg', alt: 'Vista lateral del tambor' },
      { type: 'video', src: '/productos/cf219a/video.mp4', poster: '/productos/cf219a/video-poster.jpg' },
      { type: 'image', src: '/productos/cf219a/caja.svg', alt: 'Presentación en caja' },
    ],
  },
  { id: 'cf226a', category: 'Toner', name: 'Toner 26A negro', brand: 'Genérico', fits: 'HP LaserJet Pro M402, MFP M426', yield: '3.100 págs.', price: 27500, stock: 22, color: 'k', kind: 'toner', code: 'CF226A' },
  { id: 'tn1060', category: 'Toner', name: 'Toner TN-1060', brand: 'Genérico', fits: 'Brother HL-1112, DCP-1512, MFC-1810', yield: '1.000 págs.', price: 14900, stock: 31, color: 'k', kind: 'toner', code: 'TN-1060' },
  { id: 'cf283a', category: 'Toner', name: 'Toner 83A negro', brand: 'Genérico', fits: 'HP LaserJet Pro M125, M127, M201, M225', yield: '1.500 págs.', price: 18700, stock: 3, color: 'k', kind: 'toner', code: 'CF283A' },
  { id: 'hp664n', category: 'Cartuchos', name: 'Cartucho 664 negro', brand: 'HP original', fits: 'HP DeskJet Ink Advantage 1115, 2135, 3635', yield: '120 págs.', price: 21300, stock: 9, color: 'k', kind: 'ink', code: 'F6V29AL' },
  { id: 'hp664c', category: 'Cartuchos', name: 'Cartucho 664 tricolor', brand: 'HP original', fits: 'HP DeskJet Ink Advantage 1115, 2135, 3635', yield: '100 págs.', price: 23800, stock: 7, color: 'm', kind: 'ink', code: 'F6V28AL' },
  { id: 'ep544c', category: 'Botellas de tinta', name: 'Tinta T544 cian 65 ml', brand: 'Epson original', fits: 'Epson L3110, L3150, L3210, L3250', yield: '7.500 págs.', price: 11900, stock: 40, color: 'c', kind: 'bottle', code: 'T544220' },
  { id: 'ep544m', category: 'Botellas de tinta', name: 'Tinta T544 magenta 65 ml', brand: 'Epson original', fits: 'Epson L3110, L3150, L3210, L3250', yield: '7.500 págs.', price: 11900, stock: 36, color: 'm', kind: 'bottle', code: 'T544320' },
  { id: 'ep544y', category: 'Botellas de tinta', name: 'Tinta T544 amarillo 65 ml', brand: 'Epson original', fits: 'Epson L3110, L3150, L3210, L3250', yield: '7.500 págs.', price: 11900, stock: 2, color: 'y', kind: 'bottle', code: 'T544420' },
  { id: 'dr1060', category: 'Tambores', name: 'Unidad de imagen DR-1060', brand: 'Genérico', fits: 'Brother HL-1112, DCP-1512, MFC-1810', yield: '10.000 págs.', price: 24500, stock: 11, color: 'k', kind: 'drum', code: 'DR-1060' },
  { id: 'a4-75', category: 'Papel', name: 'Resma A4 75 g, 500 hojas', brand: 'Autor', fits: 'Láser e inkjet', yield: '500 hojas', price: 7900, stock: 120, color: 'y', kind: 'paper', code: 'A4-75' },
  { id: 'a4-80', category: 'Papel', name: 'Resma A4 80 g, 500 hojas', brand: 'Chamex', fits: 'Láser e inkjet', yield: '500 hojas', price: 8900, stock: 64, color: 'c', kind: 'paper', code: 'A4-80' },
]

export const CATEGORIES = ['Todos', ...new Set(PRODUCTS.map((p) => p.category))]

export const findProduct = (id: string) => PRODUCTS.find((p) => p.id === id)
