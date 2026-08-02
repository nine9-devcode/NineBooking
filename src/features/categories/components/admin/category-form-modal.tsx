"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Loader2, FolderTree, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

// Schema with parentId field
const categorySchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อหมวดหมู่").max(100, "ชื่อยาวเกินไป"),
  slug: z
    .string()
    .min(1, "กรุณากรอก slug")
    .max(100, "slug ยาวเกินไป")
    .regex(/^[a-z0-9-]+$/, "slug ต้องเป็นตัวอักษรพิมพ์เล็ก, ตัวเลข และ - เท่านั้น"),
  description: z.string().optional(),
  isActive: z.boolean(),
  parentId: z.string().optional(),
})

type CategoryFormData = z.infer<typeof categorySchema>

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  isActive: boolean
  parentId: string | null
  parent?: {
    id: string
    name: string
  } | null
  _count?: {
    children: number
  }
}

interface ParentCategory {
  id: string
  name: string
  slug: string
  children?: { id: string; name: string }[]
}

interface CategoryFormModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  category?: Category | null
}

export function CategoryFormModal({
  open,
  onClose,
  onSuccess,
  category,
}: CategoryFormModalProps) {
  const [loading, setLoading] = useState(false)
  const [parentCategories, setParentCategories] = useState<ParentCategory[]>([])
  const [loadingParents, setLoadingParents] = useState(false)
  const isEdit = !!category

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      isActive: true,
      parentId: "",
    },
  })

  // ดึง parent categories
  useEffect(() => {
    if (open) {
      fetchParentCategories()
    }
  }, [open])

  const fetchParentCategories = async () => {
    setLoadingParents(true)
    try {
      const response = await fetch("/api/admin/categories?flat=true")
      const data = await response.json()
      if (response.ok) {
        setParentCategories(data.categories || [])
      }
    } catch (error) {
      console.error("Error fetching parent categories:", error)
    } finally {
      setLoadingParents(false)
    }
  }

  // Reset form เมื่อเปิด/ปิด modal หรือเปลี่ยน category
  useEffect(() => {
    if (open) {
      if (category) {
        form.reset({
          name: category.name,
          slug: category.slug,
          description: category.description || "",
          isActive: category.isActive,
          parentId: category.parentId || "",
        })
      } else {
        form.reset({
          name: "",
          slug: "",
          description: "",
          isActive: true,
          parentId: "",
        })
      }
    }
  }, [open, category, form])

  // Auto-generate slug จากชื่อ
  const handleNameChange = (name: string) => {
    if (!isEdit) {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim()
      form.setValue("slug", slug)
    }
  }

  // กรอง parent categories
  const getAvailableParents = (): ParentCategory[] => {
    if (!isEdit || !category) return parentCategories
    
    return parentCategories.filter((parent) => {
      // ไม่แสดงตัวเอง
      if (parent.id === category.id) return false
      // ไม่แสดงถ้าเป็น child ของตัวเอง
      if (parent.children?.some((child) => child.id === category.id)) return false
      return true
    })
  }

  const onSubmit = async (data: CategoryFormData) => {
    setLoading(true)
    try {
      const url = isEdit
        ? `/api/admin/categories/${category.id}`
        : "/api/admin/categories"

      // Prepare data
      const submitData = {
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        isActive: data.isActive,
        parentId: data.parentId || null,
      }

      const response = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success(
          isEdit ? "แก้ไขหมวดหมู่สำเร็จ" : "เพิ่มหมวดหมู่สำเร็จ"
        )
        onSuccess()
        onClose()
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด")
      }
    } catch (error) {
      console.error("Error saving category:", error)
      toast.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล")
    } finally {
      setLoading(false)
    }
  }

  // ตรวจสอบว่าต้องแสดง warning
  const showParentWarning = isEdit && category?._count?.children && category._count.children > 0

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:w-auto max-w-2xl max-h-[90vh] bg-background border-border text-foreground overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-2xl">
            {isEdit ? "แก้ไขหมวดหมู่" : "เพิ่มหมวดหมู่ใหม่"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {isEdit
              ? "แก้ไขข้อมูลหมวดหมู่สินค้า"
              : "เพิ่มหมวดหมู่สินค้าใหม่เข้าสู่ระบบ"}
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto pr-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" id="category-form">
              {/* Parent Category Selector */}
              <FormField
                control={form.control}
                name="parentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <FolderTree className="w-4 h-4" />
                      หมวดหมู่หลัก (ถ้ามี)
                    </FormLabel>
                    <Select
                      value={field.value || "none"}
                      onValueChange={(value) => field.onChange(value === "none" ? "" : value)}
                      disabled={loading || loadingParents || !!showParentWarning}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-card border-border text-foreground">
                          <SelectValue placeholder="เลือกหมวดหมู่หลัก (ถ้าต้องการ)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="none" className="text-foreground">
                          ไม่มี (เป็นหมวดหมู่หลัก)
                        </SelectItem>
                        {getAvailableParents().map((parent) => (
                          <SelectItem
                            key={parent.id}
                            value={parent.id}
                            className="text-foreground"
                          >
                            <FolderTree className="w-3 h-3 inline mr-1" />
                            {parent.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-muted-foreground">
                      {showParentWarning ? (
                        <span className="text-warning flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          ไม่สามารถเปลี่ยนได้ เนื่องจากหมวดหมู่นี้มีหมวดหมู่ย่อยอยู่แล้ว
                        </span>
                      ) : (
                        "เลือกหมวดหมู่หลักเพื่อสร้างเป็นหมวดหมู่ย่อย หรือปล่อยว่างเพื่อเป็นหมวดหมู่หลัก"
                      )}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* ชื่อหมวดหมู่ */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ชื่อหมวดหมู่ *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        onChange={(e) => {
                          field.onChange(e)
                          handleNameChange(e.target.value)
                        }}
                        placeholder="เช่น กล้องวงจรปิด"
                        className="bg-card border-border text-foreground"
                        disabled={loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Slug */}
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="เช่น cameras"
                        className="bg-card border-border text-foreground"
                        disabled={loading}
                      />
                    </FormControl>
                    <FormDescription className="text-muted-foreground">
                      ใช้สำหรับ URL (ตัวอักษรพิมพ์เล็ก, ตัวเลข และ - เท่านั้น)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* คำอธิบาย */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>คำอธิบาย</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value || "")}
                        placeholder="อธิบายเกี่ยวกับหมวดหมู่นี้..."
                        className="bg-card border-border text-foreground resize-none"
                        rows={3}
                        disabled={loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* สถานะ */}
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border border-border p-4 bg-card/50">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">เปิดใช้งาน</FormLabel>
                      <FormDescription className="text-muted-foreground">
                        หมวดหมู่จะแสดงในหน้าเว็บไซต์
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={loading}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>

        {/* Footer with buttons - fixed at bottom */}
        <DialogFooter className="flex-shrink-0 mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="border-border text-foreground hover:bg-card"
          >
            ยกเลิก
          </Button>
          <Button
            type="submit"
            form="category-form"
            disabled={loading}
            className="bg-primary hover:bg-primary/90"
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isEdit ? "บันทึกการแก้ไข" : "เพิ่มหมวดหมู่"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}