// components/admin/quotations/quotation-modal/index.tsx
// Modal สำหรับสร้างใบเสนอราคาใหม่จาก Order

"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2, FileText, Save, Package, Link2, Calculator, Calendar, StickyNote } from "lucide-react"
import { QuotationItemFormData, OrderItemForQuotation } from "../types"
import { formatCurrency, VALID_DAYS_OPTIONS, DEFAULT_PDF_NOTES } from "../constants"
import { cn } from "@/lib/utils"

interface QuotationModalProps {
  orderId: string
  orderNumber: string
  orderItems: OrderItemForQuotation[]
  customer: {
    name: string
    nickname: string | null
    email: string
    phone: string
  }
  isOpen: boolean
  onClose: () => void
  onSuccess?: (quotationId: string) => void
}

export function QuotationModal({
  orderId,
  orderNumber,
  orderItems,
  customer,
  isOpen,
  onClose,
  onSuccess,
}: QuotationModalProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  // Form state
  const [items, setItems] = useState<QuotationItemFormData[]>([])
  const [includeVat, setIncludeVat] = useState(true)
  const [vatPercent, setVatPercent] = useState(7)
  const [validDays, setValidDays] = useState(15)
  const [notes, setNotes] = useState("")
  // Mode and text are tracked separately to prevent auto-switch when textarea is cleared
  const [pdfNotesMode, setPdfNotesMode] = useState<'template' | 'custom' | 'none'>('template')
  const [pdfCustomText, setPdfCustomText] = useState(DEFAULT_PDF_NOTES)
  // Derived value for POST body
  const pdfNotes = pdfNotesMode === 'template' ? null
    : pdfNotesMode === 'none' ? ''
    : pdfCustomText

  // Initialize items from order
  useEffect(() => {
    if (isOpen && orderItems.length > 0 && items.length === 0) {
      const initialItems: QuotationItemFormData[] = []

      orderItems.forEach((group) => {
        const mainTempId = `main-${group.groupId}`
        
        // Main product
        if (group.mainQuantity > 0) {
          initialItems.push({
            tempId: mainTempId,
            productId: group.product.id,
            productName: group.product.name,
            productImage: group.product.image,
            isPairedProduct: false,
            pairedWithTempId: null,
            quantity: group.mainQuantity,
            unitPrice: 0,
          })
        }

        // Paired products
        group.pairedItems.forEach((paired) => {
          initialItems.push({
            tempId: `paired-${paired.id}`,
            productId: paired.pairedProduct.id,
            productName: paired.pairedProduct.name,
            productImage: paired.pairedProduct.image,
            isPairedProduct: true,
            pairedWithTempId: mainTempId,
            quantity: paired.quantity,
            unitPrice: 0,
          })
        })
      })

      setItems(initialItems)
    }
  }, [isOpen, orderItems, items.length])

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      setItems([])
      setIncludeVat(true)
      setVatPercent(7)
      setValidDays(15)
      setNotes("")
      setPdfNotesMode('template')
      setPdfCustomText(DEFAULT_PDF_NOTES)
    }
  }, [isOpen])

  // Calculate totals
  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
    const vatAmount = includeVat ? subtotal * (vatPercent / 100) : 0
    const totalAmount = subtotal + vatAmount
    return { subtotal, vatAmount, totalAmount }
  }, [items, includeVat, vatPercent])

  // Handle item change
  const handleItemChange = (tempId: string, value: number) => {
    setItems(prev => prev.map(item =>
      item.tempId === tempId ? { ...item, unitPrice: value } : item
    ))
  }

  // Group items for display
  const groupedItems = useMemo(() => {
    const groups: { main: QuotationItemFormData; paired: QuotationItemFormData[] }[] = []
    const mainItems = items.filter(i => !i.isPairedProduct)

    mainItems.forEach(mainItem => {
      const pairedItems = items.filter(
        i => i.isPairedProduct && i.pairedWithTempId === mainItem.tempId
      )
      groups.push({ main: mainItem, paired: pairedItems })
    })

    return groups
  }, [items])

  // Handle save & go to detail page
  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          items,
          includeVat,
          vatPercent,
          validDays,
          notes,
          pdfNotes,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success("สร้างใบเสนอราคาเรียบร้อยแล้ว")
        onSuccess?.(data.quotation.id)
        onClose()
        // ไปหน้า detail เพื่อแก้ไข/ดู preview
        router.push(`/admin/quotations/${data.quotation.id}`)
      } else {
        toast.error(data.error || "เกิดข้อผิดพลาด")
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการบันทึก")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-hidden bg-background border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            สร้างใบเสนอราคา
            <span className="text-muted-foreground font-normal ml-2">
              (อ้างอิง: {orderNumber})
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[70vh] space-y-6 pr-2">
          {/* Customer Info */}
          <div className="bg-card/50 rounded-lg p-4 border border-border">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">ข้อมูลลูกค้า</h3>
            <p className="text-foreground">
              {customer.name}
              {customer.nickname && <span className="text-muted-foreground"> ({customer.nickname})</span>}
            </p>
            <p className="text-muted-foreground text-sm">{customer.phone} • {customer.email}</p>
          </div>

          {/* Items */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Package className="w-4 h-4" />
              รายการสินค้า
            </h3>

            {/* Header */}
            <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-card rounded-lg text-sm font-medium text-muted-foreground">
              <div className="col-span-1">#</div>
              <div className="col-span-5">รายการ</div>
              <div className="col-span-2 text-center">จำนวน</div>
              <div className="col-span-2 text-right">ราคา/หน่วย</div>
              <div className="col-span-2 text-right">รวม</div>
            </div>

            {/* Items */}
            <div className="space-y-3">
              {groupedItems.map((group, index) => (
                <div key={group.main.tempId} className="space-y-2">
                  {/* Main Product */}
                  <div className="grid grid-cols-12 gap-2 items-center px-4 py-3 bg-card/50 rounded-lg border border-border">
                    <div className="col-span-1 text-muted-foreground font-medium">
                      {index + 1}
                    </div>

                    <div className="col-span-5 flex items-center gap-3">
                      <div className="relative w-10 h-10 bg-secondary rounded overflow-hidden flex-shrink-0">
                        {group.main.productImage ? (
                          <Image
                            src={group.main.productImage}
                            alt={group.main.productName}
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-foreground text-sm font-medium truncate">
                          {group.main.productName}
                        </p>
                        {group.paired.length > 0 && (
                          <p className="text-xs text-primary">
                            + {group.paired.length} สินค้าคู่
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="col-span-2 text-center">
                      <span className="text-foreground font-medium">
                        {group.main.quantity}
                      </span>
                    </div>

                    <div className="col-span-2">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={group.main.unitPrice || ""}
                        onChange={(e) => handleItemChange(
                          group.main.tempId,
                          parseFloat(e.target.value) || 0
                        )}
                        placeholder="0.00"
                        className="bg-secondary border-border text-foreground text-right h-9"
                      />
                    </div>

                    <div className="col-span-2 text-right">
                      <span className="text-foreground font-medium">
                        {formatCurrency(group.main.quantity * group.main.unitPrice)}
                      </span>
                    </div>
                  </div>

                  {/* Paired Products */}
                  {group.paired.map((paired) => (
                    <div
                      key={paired.tempId}
                      className="grid grid-cols-12 gap-2 items-center px-4 py-3 ml-6 bg-warning/10 rounded-lg border border-warning/20"
                    >
                      <div className="col-span-1">
                        <Link2 className="w-4 h-4 text-warning mx-auto" />
                      </div>

                      <div className="col-span-5 flex items-center gap-3">
                        <div className="relative w-8 h-8 bg-secondary rounded overflow-hidden flex-shrink-0">
                          {paired.productImage ? (
                            <Image
                              src={paired.productImage}
                              alt={paired.productName}
                              fill
                              className="object-cover"
                              sizes="32px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-4 h-4 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-warning text-sm truncate">
                            {paired.productName}
                          </p>
                          <span className="text-xs px-1.5 py-0.5 bg-warning/10 text-warning rounded">
                            สินค้าคู่
                          </span>
                        </div>
                      </div>

                      <div className="col-span-2 text-center">
                        <span className="text-warning font-medium">
                          {paired.quantity}
                        </span>
                      </div>

                      <div className="col-span-2">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={paired.unitPrice || ""}
                          onChange={(e) => handleItemChange(
                            paired.tempId,
                            parseFloat(e.target.value) || 0
                          )}
                          placeholder="0.00"
                          className="bg-secondary border-warning/30 text-warning text-right h-9"
                        />
                      </div>

                      <div className="col-span-2 text-right">
                        <span className="text-warning font-medium">
                          {formatCurrency(paired.quantity * paired.unitPrice)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-card/50 rounded-lg p-4 border border-border space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              สรุปยอดเงิน
            </h3>

            {/* VAT Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Switch
                  id="include-vat"
                  checked={includeVat}
                  onCheckedChange={setIncludeVat}
                />
                <Label htmlFor="include-vat" className="text-foreground cursor-pointer">
                  รวมภาษีมูลค่าเพิ่ม (VAT)
                </Label>
              </div>

              {includeVat && (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={vatPercent}
                    onChange={(e) => setVatPercent(parseFloat(e.target.value) || 0)}
                    className="w-20 bg-secondary border-border text-foreground text-right h-9"
                  />
                  <span className="text-muted-foreground">%</span>
                </div>
              )}
            </div>

            {/* Amounts */}
            <div className="space-y-2 pt-3 border-t border-border">
              <div className="flex justify-between text-foreground">
                <span>รวมเป็นเงิน</span>
                <span>{formatCurrency(totals.subtotal)} บาท</span>
              </div>
              {includeVat && (
                <div className="flex justify-between text-foreground">
                  <span>VAT {vatPercent}%</span>
                  <span>{formatCurrency(totals.vatAmount)} บาท</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-border">
                <span className="text-foreground font-semibold">รวมทั้งสิ้น</span>
                <span className="text-primary font-bold text-lg">
                  {formatCurrency(totals.totalAmount)} บาท
                </span>
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-card/50 rounded-lg p-4 border border-border">
              <Label className="flex items-center gap-2 text-foreground mb-3">
                <Calendar className="w-4 h-4 text-primary" />
                ใบเสนอราคามีอายุ
              </Label>
              <Select
                value={validDays.toString()}
                onValueChange={(value) => setValidDays(parseInt(value))}
              >
                <SelectTrigger className="bg-secondary border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {VALID_DAYS_OPTIONS.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value.toString()}
                      className="text-foreground hover:bg-secondary"
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="bg-card/50 rounded-lg p-4 border border-border space-y-4">
              {/* Admin Notes */}
              <div>
                <Label className="flex items-center gap-2 text-foreground mb-1">
                  <StickyNote className="w-4 h-4 text-primary" />
                  โน้ตสำหรับแอดมิน
                </Label>
                <p className="text-xs text-muted-foreground mb-2">ไม่แสดงใน PDF</p>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="บันทึกภายใน (ถ้ามี)"
                  className="bg-secondary border-border text-foreground resize-none h-16"
                />
              </div>

              {/* PDF Notes */}
              <div>
                <Label className="flex items-center gap-2 text-foreground mb-3">
                  <FileText className="w-4 h-4 text-primary" />
                  หมายเหตุใน PDF
                </Label>
                <div className="flex gap-1 mb-3 p-1 bg-secondary/50 rounded-lg w-fit">
                  {(['template', 'custom', 'none'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setPdfNotesMode(m)
                        if (m === 'custom' && pdfNotesMode !== 'custom') {
                          // keep existing customText when switching to custom
                        }
                      }}
                      className={cn(
                        "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                        pdfNotesMode === m
                          ? "bg-primary text-primary-foreground shadow"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                      )}
                    >
                      {m === 'template' ? 'มาตรฐาน' : m === 'custom' ? 'กำหนดเอง' : 'ไม่มี'}
                    </button>
                  ))}
                </div>
                {pdfNotesMode === 'template' && (
                  <div className="bg-secondary/30 border border-border rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">ข้อความที่จะแสดงใน PDF:</p>
                    <p className="text-xs text-foreground whitespace-pre-line leading-relaxed">
                      {DEFAULT_PDF_NOTES}
                    </p>
                  </div>
                )}
                {pdfNotesMode === 'custom' && (
                  <Textarea
                    value={pdfCustomText}
                    onChange={(e) => setPdfCustomText(e.target.value)}
                    placeholder="ข้อความหมายเหตุที่จะแสดงใน PDF..."
                    className="bg-secondary border-border text-foreground resize-none h-24"
                  />
                )}
                {pdfNotesMode === 'none' && (
                  <div className="bg-secondary/30 border border-dashed border-border rounded-lg p-3">
                    <p className="text-xs text-muted-foreground text-center">ไม่มีหมายเหตุแสดงใน PDF</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-info/10 rounded-lg p-4 border border-info/20">
            <p className="text-sm text-info">
              💡 หลังจากสร้างใบเสนอราคาแล้ว คุณจะถูกนำไปยังหน้ารายละเอียด
              ซึ่งสามารถดูตัวอย่าง PDF, แก้ไขข้อมูล และเปลี่ยนสถานะได้
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="text-sm text-muted-foreground">
            ยอดรวม: <span className="text-foreground font-semibold">{formatCurrency(totals.totalAmount)} บาท</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-border text-foreground hover:bg-card"
            >
              ยกเลิก
            </Button>

            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-primary hover:bg-primary/90"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              สร้างใบเสนอราคา
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}