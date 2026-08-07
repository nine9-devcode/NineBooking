"use client"

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import type {
  CartItem,
  CartState,
  AddToCartParams,
  UpdateCartItemParams,
} from "@/features/cart/cart"

// Context Types
interface CartContextType extends CartState {
  addToCart: (params: AddToCartParams) => Promise<boolean>
  updateCartItem: (id: string, params: UpdateCartItemParams) => Promise<boolean>
  removeFromCart: (id: string) => Promise<boolean>
  clearCart: () => Promise<boolean>
  refreshCart: () => Promise<void>
}

// Default State
const defaultCartState: CartState = {
  items: [],
  totalItems: 0,
  count: 0,
  isLoading: false,
  error: null,
}

// Create Context
const CartContext = createContext<CartContextType | undefined>(undefined)

// Provider Props
interface CartProviderProps {
  children: ReactNode
}

// Cart Provider Component
export function CartProvider({ children }: CartProviderProps) {
  const { status } = useSession()
  const [state, setState] = useState<CartState>(defaultCartState)

  // Fetch cart from API
  const fetchCart = useCallback(async () => {
    if (status !== "authenticated") {
      setState(defaultCartState)
      return
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await fetch("/api/cart")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "ไม่สามารถดึงข้อมูลตะกร้าได้")
      }

      setState({
        items: data.items,
        totalItems: data.totalItems,
        count: data.count,
        isLoading: false,
        error: null,
      })
    } catch (error) {
      console.error("Error fetching cart:", error)
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
      }))
    }
  }, [status])

  // Fetch cart on mount and when session changes
  useEffect(() => {
    if (status === "authenticated") {
      fetchCart()
    } else if (status === "unauthenticated") {
      setState(defaultCartState)
    }
  }, [status, fetchCart])

  // Add to cart
  const addToCart = useCallback(
    async (params: AddToCartParams): Promise<boolean> => {
      if (status !== "authenticated") {
        toast.error("กรุณาเข้าสู่ระบบก่อนเพิ่มสินค้า")
        return false
      }

      try {
        const response = await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: params.productId,
            quantity: params.quantity ?? 1,
            pairedProductId: params.pairedProductId ?? null,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "ไม่สามารถเพิ่มสินค้าได้")
        }

        // Refresh cart to get updated data
        await fetchCart()

        toast.success(data.message || "เพิ่มลงตะกร้าแล้ว")
        return true
      } catch (error) {
        console.error("Error adding to cart:", error)
        toast.error(error instanceof Error ? error.message : "เกิดข้อผิดพลาด")
        return false
      }
    },
    [status, fetchCart]
  )

  // Update cart item
  const updateCartItem = useCallback(
    async (id: string, params: UpdateCartItemParams): Promise<boolean> => {
      if (status !== "authenticated") {
        toast.error("กรุณาเข้าสู่ระบบ")
        return false
      }

      try {
        const response = await fetch(`/api/cart/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "ไม่สามารถอัพเดทได้")
        }

        // Refresh cart
        await fetchCart()

        return true
      } catch (error) {
        console.error("Error updating cart item:", error)
        toast.error(error instanceof Error ? error.message : "เกิดข้อผิดพลาด")
        return false
      }
    },
    [status, fetchCart]
  )

  // Remove from cart
  const removeFromCart = useCallback(
    async (id: string): Promise<boolean> => {
      if (status !== "authenticated") {
        toast.error("กรุณาเข้าสู่ระบบ")
        return false
      }

      try {
        const response = await fetch(`/api/cart/${id}`, {
          method: "DELETE",
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "ไม่สามารถลบได้")
        }

        // Refresh cart
        await fetchCart()

        toast.success("ลบออกจากตะกร้าแล้ว")
        return true
      } catch (error) {
        console.error("Error removing from cart:", error)
        toast.error(error instanceof Error ? error.message : "เกิดข้อผิดพลาด")
        return false
      }
    },
    [status, fetchCart]
  )

  // Clear cart
  const clearCart = useCallback(async (): Promise<boolean> => {
    if (status !== "authenticated") {
      toast.error("กรุณาเข้าสู่ระบบ")
      return false
    }

    try {
      const response = await fetch("/api/cart", {
        method: "DELETE",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "ไม่สามารถล้างตะกร้าได้")
      }

      setState({
        items: [],
        totalItems: 0,
        count: 0,
        isLoading: false,
        error: null,
      })

      toast.success("ล้างตะกร้าเรียบร้อยแล้ว")
      return true
    } catch (error) {
      console.error("Error clearing cart:", error)
      toast.error(error instanceof Error ? error.message : "เกิดข้อผิดพลาด")
      return false
    }
  }, [status])

  // Refresh cart
  const refreshCart = useCallback(async () => {
    await fetchCart()
  }, [fetchCart])

  const value: CartContextType = {
    ...state,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    refreshCart,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

// Custom Hook
export function useCart() {
  const context = useContext(CartContext)

  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }

  return context
}
