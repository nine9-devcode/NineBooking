// lib/Cart Item Types
export interface CartProduct {
  id: string
  name: string
  subtitle: string | null
  slug: string
  image: string | null
  isActive: boolean
  category: {
    id: string
    name: string
    slug?: string
  }
}

export interface CartPairedProduct {
  id: string
  name: string
  subtitle?: string | null
  slug?: string
  image: string | null
  isActive?: boolean
}

export interface CartItem {
  id: string
  userId: string
  productId: string
  quantity: number
  pairedProductId: string | null
  product: CartProduct
  pairedProduct: CartPairedProduct | null
  createdAt: string
  updatedAt: string
}

export interface CartState {
  items: CartItem[]
  totalItems: number
  count: number
  isLoading: boolean
  error: string | null
}

export interface AddToCartParams {
  productId: string
  quantity?: number
  pairedProductId?: string | null
}

export interface UpdateCartItemParams {
  quantity?: number
  pairedProductId?: string | null
}
