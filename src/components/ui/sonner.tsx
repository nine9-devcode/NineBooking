"use client"

import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

/**
 * เว็บนี้เป็นธีมเข้มอย่างเดียว จึงตรึง theme ไว้ที่ dark
 *
 * ของเดิมเรียก useTheme() ของ next-themes โดยที่ไม่มี ThemeProvider อยู่ในต้นไม้เลย
 * ค่าที่ได้จึงเป็น "system" — เครื่องที่ตั้ง OS เป็นโหมดสว่างจะเห็น toast สีขาว
 * โผล่บนเว็บพื้นน้ำเงินเข้ม
 */
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-popover group-[.toaster]:text-popover-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
