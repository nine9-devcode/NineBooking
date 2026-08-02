export interface Product {
  id: string
  name: string
  subtitle: string | null
  slug: string
  image: string | null
  category: {
    id: string
    name: string
    slug: string
  }
}
