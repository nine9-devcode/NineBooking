// // components/admin/quotations/quotation-modal/summary-section.tsx

// "use client"

// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Textarea } from "@/components/ui/textarea"
// import { Switch } from "@/components/ui/switch"
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select"
// import { Calculator, Calendar, FileText } from "lucide-react"
// import { formatCurrency, VALID_DAYS_OPTIONS } from "../constants"

// interface SummarySectionProps {
//   subtotal: number
//   vatAmount: number
//   totalAmount: number
//   includeVat: boolean
//   vatPercent: number
//   validDays: number
//   notes: string
//   onIncludeVatChange: (value: boolean) => void
//   onVatPercentChange: (value: number) => void
//   onValidDaysChange: (value: number) => void
//   onNotesChange: (value: string) => void
// }

// export function SummarySection({
//   subtotal,
//   vatAmount,
//   totalAmount,
//   includeVat,
//   vatPercent,
//   validDays,
//   notes,
//   onIncludeVatChange,
//   onVatPercentChange,
//   onValidDaysChange,
//   onNotesChange,
// }: SummarySectionProps) {
//   return (
//     <div className="space-y-6">
//       {/* Summary Box */}
//       <div className="bg-card/50 rounded-xl border border-border overflow-hidden">
//         <div className="px-6 py-4 border-b border-border bg-card/80">
//           <h3 className="font-semibold text-foreground flex items-center gap-2">
//             <Calculator className="w-5 h-5 text-primary" />
//             สรุปยอดเงิน
//           </h3>
//         </div>

//         <div className="p-6 space-y-4">
//           {/* VAT Toggle */}
//           <div className="flex items-center justify-between">
//             <div className="flex items-center gap-3">
//               <Switch
//                 id="include-vat"
//                 checked={includeVat}
//                 onCheckedChange={onIncludeVatChange}
//               />
//               <Label htmlFor="include-vat" className="text-foreground cursor-pointer">
//                 รวมภาษีมูลค่าเพิ่ม (VAT)
//               </Label>
//             </div>

//             {includeVat && (
//               <div className="flex items-center gap-2">
//                 <Input
//                   type="number"
//                   min="0"
//                   max="100"
//                   step="0.5"
//                   value={vatPercent}
//                   onChange={(e) => onVatPercentChange(parseFloat(e.target.value) || 0)}
//                   className="w-20 bg-secondary border-border text-foreground text-right h-9"
//                 />
//                 <span className="text-muted-foreground">%</span>
//               </div>
//             )}
//           </div>

//           {/* Amounts */}
//           <div className="space-y-3 pt-4 border-t border-border">
//             <div className="flex justify-between text-foreground">
//               <span>รวมเป็นเงิน</span>
//               <span className="font-medium">{formatCurrency(subtotal)} บาท</span>
//             </div>

//             {includeVat && (
//               <div className="flex justify-between text-foreground">
//                 <span>ภาษีมูลค่าเพิ่ม {vatPercent}%</span>
//                 <span className="font-medium">{formatCurrency(vatAmount)} บาท</span>
//               </div>
//             )}

//             <div className="flex justify-between pt-3 border-t border-border">
//               <span className="text-foreground font-semibold text-lg">จำนวนเงินรวมทั้งสิ้น</span>
//               <span className="text-primary font-bold text-lg">
//                 {formatCurrency(totalAmount)} บาท
//               </span>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Settings */}
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//         {/* Valid Days */}
//         <div className="bg-card/50 rounded-lg p-4 border border-border">
//           <Label className="flex items-center gap-2 text-foreground mb-3">
//             <Calendar className="w-4 h-4 text-primary" />
//             ใบเสนอราคามีอายุ
//           </Label>
//           <Select
//             value={validDays.toString()}
//             onValueChange={(value) => onValidDaysChange(parseInt(value))}
//           >
//             <SelectTrigger className="bg-secondary border-border text-foreground">
//               <SelectValue />
//             </SelectTrigger>
//             <SelectContent className="bg-card border-border">
//               {VALID_DAYS_OPTIONS.map((option) => (
//                 <SelectItem
//                   key={option.value}
//                   value={option.value.toString()}
//                   className="text-foreground hover:bg-secondary"
//                 >
//                   {option.label}
//                 </SelectItem>
//               ))}
//             </SelectContent>
//           </Select>
//         </div>

//         {/* Notes */}
//         <div className="bg-card/50 rounded-lg p-4 border border-border">
//           <Label className="flex items-center gap-2 text-foreground mb-3">
//             <FileText className="w-4 h-4 text-primary" />
//             หมายเหตุเพิ่มเติม
//           </Label>
//           <Textarea
//             value={notes}
//             onChange={(e) => onNotesChange(e.target.value)}
//             placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)"
//             className="bg-secondary border-border text-foreground resize-none h-20"
//           />
//         </div>
//       </div>

//       {/* Auto Notes Preview */}
//       <div className="bg-info/10 rounded-lg p-4 border border-info/20">
//         <h4 className="text-sm font-medium text-info mb-2">หมายเหตุที่จะแสดงใน PDF:</h4>
//         <ul className="text-sm text-info/80 space-y-1">
//           <li>• ใบเสนอราคามีอายุ {validDays} วัน นับจากวันที่ออก</li>
//           <li>• ราคาข้างต้น{includeVat ? "รวม" : "ยังไม่รวม"}ภาษีมูลค่าเพิ่ม</li>
//           <li>• กรุณาชำระมัดจำ 50% ก่อนดำเนินการ</li>
//           {notes && <li>• {notes}</li>}
//         </ul>
//       </div>
//     </div>
//   )
// }