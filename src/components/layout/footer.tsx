import Link from "next/link"
import { Github } from "lucide-react"

import { siteConfig } from "@/config/site"

interface FooterProps {
  hasSidebar?: boolean
}

const QUICK_LINKS = [
  { href: "/", label: "หน้าแรก" },
  { href: "/orders", label: "ประวัติการจอง" },
  { href: "/support", label: "แจ้งปัญหา" },
]

const LEGAL_LINKS = [
  { href: "/terms", label: "ข้อกำหนดการใช้งาน" },
  { href: "/privacy-policy", label: "นโยบายความเป็นส่วนตัว" },
]

export function Footer({ hasSidebar = false }: FooterProps) {
  return (
    <footer className={`border-t border-border bg-card ${hasSidebar ? "lg:ml-64" : ""}`}>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/mark.svg"
                alt="NineBooking"
                width={32}
                height={32}
                className="object-contain"
              />
              <span className="font-heading font-bold text-primary">{siteConfig.name}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              ระบบจองสินค้าออนไลน์ พร้อมระบบหลังบ้านครบวงจร
            </p>
          </div>

          <nav className="space-y-3">
            <h3 className="font-semibold text-foreground">ลิงก์ด่วน</h3>
            <ul className="space-y-2 text-sm">
              {QUICK_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">เกี่ยวกับโปรเจก</h3>
            <p className="text-sm text-muted-foreground">
              โปรเจกตัวอย่างแบบโอเพนซอร์ส เผยแพร่ภายใต้สัญญาอนุญาต MIT
            </p>
            <a
              href={siteConfig.repository}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              <Github className="h-4 w-4" />
              ดูซอร์สโค้ดบน GitHub
            </a>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} {siteConfig.name}
            </p>

            <div className="flex items-center gap-4 text-sm">
              {LEGAL_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
