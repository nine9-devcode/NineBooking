import type { ReactNode } from "react"

import { Footer } from "@/components/layout/footer"
import { Navbar } from "@/components/layout/navbar"

/** โครงหน้าเอกสารข้อกำหนด/นโยบาย ใช้ร่วมกันทั้งสองหน้า */
export function LegalPage({
  currentPage,
  title,
  subtitle,
  updatedAt,
  children,
}: {
  currentPage: string
  title: string
  subtitle: string
  updatedAt: string
  children: ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar currentPage={currentPage} />

      <main className="flex-1 bg-background pt-16">
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <article className="space-y-8 rounded-2xl border border-border bg-card p-6 md:p-10">
            <header className="border-b border-border pb-6">
              <h1 className="mb-2 text-2xl font-bold text-foreground">{title}</h1>
              <p className="text-muted-foreground">{subtitle}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                อัปเดตล่าสุด: {updatedAt}
              </p>
            </header>

            {children}
          </article>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export function LegalSection({
  heading,
  children,
}: {
  heading: string
  children: ReactNode
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold text-foreground">{heading}</h2>
      <div className="space-y-3 leading-relaxed text-muted-foreground">{children}</div>
    </section>
  )
}

export function LegalList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="ml-2 list-inside list-disc space-y-1">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  )
}

export function LegalNote({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-info/40 bg-info/10 p-4 text-sm text-info">
      {children}
    </div>
  )
}
