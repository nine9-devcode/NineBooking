// // components/admin/quotations/quotation-modal/preview-section.tsx

// "use client"

// import { Button } from "@/components/ui/button"
// import { Loader2, RefreshCw, FileText, AlertCircle } from "lucide-react"

// interface PreviewSectionProps {
//   pdfBase64: string | null
//   loading: boolean
//   onRefresh: () => void
// }

// export function PreviewSection({ pdfBase64, loading, onRefresh }: PreviewSectionProps) {
//   if (loading) {
//     return (
//       <div className="flex flex-col items-center justify-center py-20">
//         <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
//         <p className="text-muted-foreground">กำลังสร้างตัวอย่าง...</p>
//       </div>
//     )
//   }

//   if (!pdfBase64) {
//     return (
//       <div className="flex flex-col items-center justify-center py-20 text-center">
//         <AlertCircle className="w-12 h-12 text-warning mb-4" />
//         <h3 className="text-lg font-semibold text-foreground mb-2">
//           ยังไม่มีตัวอย่าง PDF
//         </h3>
//         <p className="text-muted-foreground mb-6 max-w-md">
//           กรุณาบันทึกใบเสนอราคาก่อน จึงจะสามารถดูตัวอย่าง PDF ได้
//         </p>
//         <Button
//           variant="outline"
//           onClick={onRefresh}
//           className="border-border text-foreground hover:bg-card"
//         >
//           <RefreshCw className="w-4 h-4 mr-2" />
//           โหลดตัวอย่าง
//         </Button>
//       </div>
//     )
//   }

//   return (
//     <div className="space-y-4">
//       {/* Refresh Button */}
//       <div className="flex items-center justify-between">
//         <div className="flex items-center gap-2 text-muted-foreground">
//           <FileText className="w-4 h-4" />
//           <span className="text-sm">ตัวอย่างใบเสนอราคา</span>
//         </div>
//         <Button
//           variant="ghost"
//           size="sm"
//           onClick={onRefresh}
//           className="text-muted-foreground hover:text-foreground"
//         >
//           <RefreshCw className="w-4 h-4 mr-2" />
//           รีเฟรช
//         </Button>
//       </div>

//       {/* PDF Viewer */}
//       <div className="relative bg-card rounded-lg overflow-hidden border border-border">
//         <iframe
//           src={`data:application/pdf;base64,${pdfBase64}`}
//           className="w-full h-[500px]"
//           title="Quotation Preview"
//         />
//       </div>

//       {/* Tips */}
//       <div className="bg-card/50 rounded-lg p-4 border border-border">
//         <p className="text-sm text-muted-foreground">
//           💡 <strong className="text-foreground">เคล็ดลับ:</strong> หากไม่เห็น PDF ให้กดปุ่ม "รีเฟรช" หรือดาวน์โหลดเพื่อดูไฟล์โดยตรง
//         </p>
//       </div>
//     </div>
//   )
// }
