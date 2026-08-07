"use client"

import { use, useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, CheckCircle2, Download, FileText, XCircle } from "lucide-react"
import { toast } from "sonner"

import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { PageContainer } from "@/components/ui/page-container"
import { QuotationStatusBadge } from "@/components/ui/status-badge"
import { EmptyState, LoadingState } from "@/components/ui/states"
import { Textarea } from "@/components/ui/textarea"
import { formatDate } from "@/lib/utils"
import type { QuotationStatus } from "@prisma/client"

interface QuotationItem {
  id: string
  productName: string
  isPairedProduct: boolean
  quantity: number
  unitPrice: string
  amount: string
}

interface Quotation {
  id: string
  quotationNumber: string
  status: QuotationStatus
  version: number
  subtotal: string
  includeVat: boolean
  vatPercent: string
  vatAmount: string
  totalAmount: string
  validUntil: string
  notes: string | null
  respondedAt: string | null
  respondedNote: string | null
  items: QuotationItem[]
}

const baht = (value: string) =>
  new Intl.NumberFormat("th-TH", { minimumFractionDigits: 2 }).format(Number(value))

export default function CustomerQuotationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  const [quotation, setQuotation] = useState<Quotation | null>(null)
  const [orderNumber, setOrderNumber] = useState("")
  const [canRespond, setCanRespond] = useState(false)
  const [loading, setLoading] = useState(true)
  const [note, setNote] = useState("")
  const [pending, setPending] = useState<"accept" | "reject" | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/orders/${id}/quotation`)
      if (!res.ok) {
        setQuotation(null)
        return
      }
      const data = await res.json()
      setQuotation(data.quotation)
      setOrderNumber(data.orderNumber)
      setCanRespond(data.canRespond)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  async function respond(action: "accept" | "reject") {
    const res = await fetch(`/api/orders/${id}/quotation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, note: note.trim() || undefined }),
    })

    const data = await res.json()

    if (!res.ok) {
      toast.error(data.error ?? "ดำเนินการไม่สำเร็จ")
      throw new Error(data.error)
    }

    toast.success(data.message)
    await load()
  }

  return (
    <>
      <Navbar currentPage="ใบเสนอราคา" />

      <main className="min-h-screen bg-muted pt-16 pb-12">
        <PageContainer size="narrow">
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link href={`/orders/${id}`}>
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              กลับไปหน้าคำสั่งจอง
            </Link>
          </Button>

          {loading ? (
            <LoadingState label="กำลังโหลดใบเสนอราคา..." />
          ) : !quotation ? (
            <EmptyState
              icon={FileText}
              title="ยังไม่มีใบเสนอราคา"
              description="เจ้าหน้าที่จะจัดทำใบเสนอราคาและส่งให้คุณหลังตรวจสอบรายการจองแล้ว"
            />
          ) : (
            <div className="space-y-5">
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h1 className="text-xl font-semibold text-foreground">
                      {quotation.quotationNumber}
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                      สำหรับคำสั่งจอง {orderNumber}
                      {quotation.version > 1 && ` · ฉบับแก้ไขครั้งที่ ${quotation.version}`}
                    </p>
                  </div>
                  <QuotationStatusBadge status={quotation.status} />
                </div>

                <p className="mt-4 text-sm text-muted-foreground">
                  ยืนราคาถึง {formatDate(quotation.validUntil)}
                </p>

                {quotation.respondedAt && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    คุณตอบกลับเมื่อ {formatDate(quotation.respondedAt)}
                    {quotation.respondedNote && ` — “${quotation.respondedNote}”`}
                  </p>
                )}
              </div>

              <div className="overflow-x-auto rounded-xl border border-border bg-card">
                <table className="w-full min-w-[520px] text-sm">
                  <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">รายการ</th>
                      <th className="px-4 py-3 text-right font-medium">จำนวน</th>
                      <th className="px-4 py-3 text-right font-medium">ราคา/หน่วย</th>
                      <th className="px-4 py-3 text-right font-medium">รวม</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {quotation.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3">
                          <span
                            className={item.isPairedProduct ? "pl-4 text-muted-foreground" : ""}
                          >
                            {item.isPairedProduct && "↳ "}
                            {item.productName}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">{item.quantity}</td>
                        <td className="px-4 py-3 text-right">{baht(item.unitPrice)}</td>
                        <td className="px-4 py-3 text-right">{baht(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t border-border text-sm">
                    <tr>
                      <td colSpan={3} className="px-4 py-2 text-right text-muted-foreground">
                        ยอดก่อนภาษี
                      </td>
                      <td className="px-4 py-2 text-right">{baht(quotation.subtotal)}</td>
                    </tr>
                    {quotation.includeVat && (
                      <tr>
                        <td colSpan={3} className="px-4 py-2 text-right text-muted-foreground">
                          ภาษีมูลค่าเพิ่ม {Number(quotation.vatPercent)}%
                        </td>
                        <td className="px-4 py-2 text-right">{baht(quotation.vatAmount)}</td>
                      </tr>
                    )}
                    <tr className="font-semibold">
                      <td colSpan={3} className="px-4 py-3 text-right">
                        ยอดรวมทั้งสิ้น
                      </td>
                      <td className="px-4 py-3 text-right text-primary">
                        {baht(quotation.totalAmount)} บาท
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {quotation.notes && (
                <div className="rounded-xl border border-border bg-card p-5 text-sm">
                  <h2 className="mb-2 font-medium text-foreground">หมายเหตุ</h2>
                  <p className="whitespace-pre-line text-muted-foreground">{quotation.notes}</p>
                </div>
              )}

              {canRespond && (
                <div className="rounded-xl border border-border bg-card p-5">
                  <h2 className="font-medium text-foreground">ตอบกลับใบเสนอราคา</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    เมื่อยอมรับแล้ว เจ้าหน้าที่จะติดต่อกลับเพื่อนัดหมายขั้นตอนถัดไป
                  </p>

                  <Textarea
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="ข้อความถึงเจ้าหน้าที่ (ไม่บังคับ)"
                    className="mt-4"
                    maxLength={500}
                  />

                  <div className="mt-4 flex flex-wrap gap-3">
                    <Button onClick={() => setPending("accept")}>
                      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                      ยอมรับใบเสนอราคา
                    </Button>
                    <Button variant="outline" onClick={() => setPending("reject")}>
                      <XCircle className="h-4 w-4" aria-hidden="true" />
                      ปฏิเสธ
                    </Button>
                  </div>
                </div>
              )}

              <Button variant="outline" asChild>
                <a href={`/api/orders/${id}/quotation/pdf`} target="_blank" rel="noreferrer">
                  <Download className="h-4 w-4" aria-hidden="true" />
                  ดาวน์โหลด PDF
                </a>
              </Button>
            </div>
          )}
        </PageContainer>
      </main>

      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => !open && setPending(null)}
        title={pending === "accept" ? "ยอมรับใบเสนอราคา?" : "ปฏิเสธใบเสนอราคา?"}
        description={
          pending === "accept"
            ? "เมื่อยืนยันแล้วจะเปลี่ยนใจไม่ได้ เจ้าหน้าที่จะติดต่อกลับเพื่อดำเนินการต่อ"
            : "เจ้าหน้าที่จะได้รับแจ้ง และอาจติดต่อกลับเพื่อเสนอราคาใหม่"
        }
        confirmLabel={pending === "accept" ? "ยอมรับ" : "ปฏิเสธ"}
        variant={pending === "accept" ? "default" : "destructive"}
        onConfirm={() => respond(pending ?? "accept")}
      />

      <Footer />
    </>
  )
}
