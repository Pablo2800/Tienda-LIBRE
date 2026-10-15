export type InkColor = 'c' | 'm' | 'y' | 'k'
export type ProductKind = 'toner' | 'drum' | 'ink' | 'bottle' | 'paper'

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
}

// Catálogo de ejemplo para la demo. Más adelante viene de la base de datos.
export const PRODUCTS: Product[] = [
  { id: 'cf219a', category: 'Tambores', name: 'Férulas termomoldeadas', brand: 'Genérico', fits: 'HP LaserJet Pro M102, M104, MFP M130, M132', yield: '12.000 págs.', price: 38900, stock: 14, color: 'k', kind: 'drum', code: 'CF219A' },
  { id: 'cf226a', category: 'Toner', name: 'Medias de compresión', brand: 'Genérico', fits: 'HP LaserJet Pro M402, MFP M426', yield: '3.100 págs.', price: 27500, stock: 22, color: 'k', kind: 'toner', code: 'CF226A' },
  { id: 'tn1060', category: 'Toner', name: 'Suplemento de inodoro', brand: 'Genérico', fits: 'Brother HL-1112, DCP-1512, MFC-1810', yield: '1.000 págs.', price: 14900, stock: 31, color: 'k', kind: 'toner', code: 'TN-1060' },
  { id: 'cf283a', category: 'Toner', name: 'Inodoro Portátil', brand: 'Genérico', fits: 'HP LaserJet Pro M125, M127, M201, M225', yield: '1.500 págs.', price: 18700, stock: 3, color: 'k', kind: 'toner', code: 'CF283A' },
  { id: 'hp664n', category: 'Cartuchos', name: 'Ortesis termoplástica (bajo molde de yeso)', brand: 'HP original', fits: 'HP DeskJet Ink Advantage 1115, 2135, 3635', yield: '120 págs.', price: 21300, stock: 9, color: 'k', kind: 'ink', code: 'F6V29AL' },
  { id: 'hp664c', category: 'Cartuchos', name: 'Plantillas termomoldeada personalizadas', brand: 'HP original', fits: 'HP DeskJet Ink Advantage 1115, 2135, 3635', yield: '100 págs.', price: 23800, stock: 7, color: 'm', kind: 'ink', code: 'F6V28AL' },
]

export const CATEGORIES = ['Todos', ...new Set(PRODUCTS.map((p) => p.category))]

export const findProduct = (id: string) => PRODUCTS.find((p) => p.id === id)
