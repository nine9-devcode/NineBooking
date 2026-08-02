// // components/admin/quotations/quotation-modal/items-form.tsx

// "use client"

// import Image from "next/image"
// import { Input } from "@/components/ui/input"
// import { Package, Link2 } from "lucide-react"
// import { QuotationItemFormData } from "../types"
// import { formatCurrency } from "../constants"

// interface ItemsFormProps {
//   items: QuotationItemFormData[]
//   onItemChange: (tempId: string, field: keyof QuotationItemFormData, value: any) => void
// }

// export function ItemsForm({ items, onItemChange }: ItemsFormProps) {
//   // Group items: main products with their paired products
//   const groupedItems: {
//     main: QuotationItemFormData
//     paired: QuotationItemFormData[]
//   }[] = []

//   const mainItems = items.filter(i => !i.isPairedProduct)
  
//   mainItems.forEach(mainItem => {
//     const pairedItems = items.filter(
//       i => i.isPairedProduct && i.pairedWithTempId === mainItem.tempId
//     )
//     groupedItems.push({
//       main: mainItem,
//       paired: pairedItems,
//     })
//   })

//   return (
//     <div className="space-y-4">
//       {/* Header */}
//       <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-card rounded-lg text-sm font-medium text-muted-foreground">
//         <div className="col-span-1">#</div>
//         <div className="col-span-5">รายการ</div>
//         <div className="col-span-2 text-center">จำนวน</div>
//         <div className="col-span-2 text-right">ราคา/หน่วย</div>
//         <div className="col-span-2 text-right">รวม</div>
//       </div>

//       {/* Items */}
//       <div className="space-y-3">
//         {groupedItems.map((group, index) => (
//           <div key={group.main.tempId} className="space-y-2">
//             {/* Main Product */}
//             <div className="grid grid-cols-12 gap-2 items-center px-4 py-3 bg-card/50 rounded-lg border border-border">
//               <div className="col-span-1 text-muted-foreground font-medium">
//                 {index + 1}
//               </div>
              
//               <div className="col-span-5 flex items-center gap-3">
//                 <div className="relative w-10 h-10 bg-secondary rounded overflow-hidden flex-shrink-0">
//                   {group.main.productImage ? (
//                     <Image
//                       src={group.main.productImage}
//                       alt={group.main.productName}
//                       fill
//                       className="object-cover"
//                       sizes="40px"
//                     />
//                   ) : (
//                     <div className="w-full h-full flex items-center justify-center">
//                       <Package className="w-5 h-5 text-muted-foreground" />
//                     </div>
//                   )}
//                 </div>
//                 <div className="min-w-0">
//                   <p className="text-foreground text-sm font-medium truncate">
//                     {group.main.productName}
//                   </p>
//                   {group.paired.length > 0 && (
//                     <p className="text-xs text-primary">
//                       + {group.paired.length} สินค้าคู่
//                     </p>
//                   )}
//                 </div>
//               </div>

//               <div className="col-span-2 text-center">
//                 <span className="text-foreground font-medium">
//                   {group.main.quantity}
//                 </span>
//               </div>

//               <div className="col-span-2">
//                 <Input
//                   type="number"
//                   min="0"
//                   step="0.01"
//                   value={group.main.unitPrice || ""}
//                   onChange={(e) => onItemChange(
//                     group.main.tempId, 
//                     "unitPrice", 
//                     parseFloat(e.target.value) || 0
//                   )}
//                   placeholder="0.00"
//                   className="bg-secondary border-border text-foreground text-right h-9"
//                 />
//               </div>

//               <div className="col-span-2 text-right">
//                 <span className="text-foreground font-medium">
//                   {formatCurrency(group.main.quantity * group.main.unitPrice)}
//                 </span>
//               </div>
//             </div>

//             {/* Paired Products */}
//             {group.paired.map((paired) => (
//               <div 
//                 key={paired.tempId}
//                 className="grid grid-cols-12 gap-2 items-center px-4 py-3 ml-6 bg-warning/10 rounded-lg border border-warning/20"
//               >
//                 <div className="col-span-1">
//                   <Link2 className="w-4 h-4 text-warning mx-auto" />
//                 </div>

//                 <div className="col-span-5 flex items-center gap-3">
//                   <div className="relative w-8 h-8 bg-secondary rounded overflow-hidden flex-shrink-0">
//                     {paired.productImage ? (
//                       <Image
//                         src={paired.productImage}
//                         alt={paired.productName}
//                         fill
//                         className="object-cover"
//                         sizes="32px"
//                       />
//                     ) : (
//                       <div className="w-full h-full flex items-center justify-center">
//                         <Package className="w-4 h-4 text-muted-foreground" />
//                       </div>
//                     )}
//                   </div>
//                   <div className="min-w-0">
//                     <p className="text-warning text-sm truncate">
//                       {paired.productName}
//                     </p>
//                     <span className="text-xs px-1.5 py-0.5 bg-warning/10 text-warning rounded">
//                       สินค้าคู่
//                     </span>
//                   </div>
//                 </div>

//                 <div className="col-span-2 text-center">
//                   <span className="text-warning font-medium">
//                     {paired.quantity}
//                   </span>
//                 </div>

//                 <div className="col-span-2">
//                   <Input
//                     type="number"
//                     min="0"
//                     step="0.01"
//                     value={paired.unitPrice || ""}
//                     onChange={(e) => onItemChange(
//                       paired.tempId, 
//                       "unitPrice", 
//                       parseFloat(e.target.value) || 0
//                     )}
//                     placeholder="0.00"
//                     className="bg-secondary border-warning/30 text-warning text-right h-9"
//                   />
//                 </div>

//                 <div className="col-span-2 text-right">
//                   <span className="text-warning font-medium">
//                     {formatCurrency(paired.quantity * paired.unitPrice)}
//                   </span>
//                 </div>
//               </div>
//             ))}
//           </div>
//         ))}
//       </div>

//       {/* Empty State */}
//       {items.length === 0 && (
//         <div className="text-center py-10 text-muted-foreground">
//           <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
//           <p>ไม่มีรายการสินค้า</p>
//         </div>
//       )}
//     </div>
//   )
// }