// components/checkout/checkout-error.tsx

import { AlertCircle } from "lucide-react"

interface CheckoutErrorProps {
  message: string
}

export function CheckoutError({ message }: CheckoutErrorProps) {
  if (!message) return null

  return (
    <div className="mb-6 p-4 bg-destructive/10 border border-destructive/40 rounded-xl flex items-center gap-3">
      <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
      <p className="text-destructive">{message}</p>
    </div>
  )
}
