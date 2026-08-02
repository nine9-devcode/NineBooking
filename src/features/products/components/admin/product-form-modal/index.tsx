"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Loader2, FileText, ImageIcon, Link2, Info } from "lucide-react"
import { toast } from "sonner"

// Components
import { BasicInfoTab } from "./basic-info-tab"
import { ImagesTab } from "./images-tab"
import { DescriptionTab } from "./description-tab"
import { DatasheetsTab } from "./datasheets-tab"
import { UploadProgressBar } from "./upload-progress-bar"

// Schema & Types
import { productSchema, defaultFormValues } from "./schema"
import type { 
  ProductFormData, 
  ProductFormModalProps, 
  ImageValue, 
  GalleryItem 
} from "./types"
import type { DatasheetItem } from "@/features/products/datasheet.types"

// Utils
import { useUploadProgress, UPLOAD_STEPS } from "./use-upload-progress"
// Note: เมื่อย้ายไปใช้งานจริง ให้เปลี่ยน path ตามโครงสร้างโปรเจกต์
import { uploadImage } from "@/features/products/components/admin/shared/image-upload"
import { uploadGallery } from "@/features/products/components/admin/shared/gallery-upload"
import { datasheetsToJson, jsonToDatasheets } from "@/features/products/components/admin/shared/datasheet-input"

// Helper: Upload datasheet file
async function uploadDatasheet(file: File): Promise<any> {
  const formData = new FormData()
  formData.append("file", file)

  const response = await fetch("/api/upload/document", {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Datasheet upload failed")
  }

  return response.json()
}

export function ProductFormModal({
  open,
  onClose,
  onSuccess,
  product,
  categories,
}: ProductFormModalProps) {
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("basic")
  const isEdit = !!product

  // Upload progress hook
  const { progress, startUpload, nextStep, completeUpload, resetProgress } = useUploadProgress()

  // Image states
  const [mainImage, setMainImage] = useState<ImageValue | null>(null)
  const [galleryImages, setGalleryImages] = useState<GalleryItem[]>([])

  // Datasheet state
  const [datasheets, setDatasheets] = useState<DatasheetItem[]>([])

  // Form
  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: defaultFormValues,
  })

  const watchName = watch("name")

  // Auto-generate slug from name (only for new products)
  useEffect(() => {
    if (!isEdit && watchName) {
      const slug = watchName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim()
      setValue("slug", slug)
    }
  }, [watchName, isEdit, setValue])

  // Reset form when modal opens/closes or product changes
  useEffect(() => {
    if (open) {
      setActiveTab("basic") // Reset to first tab
      
      if (product) {
        // Edit mode
        reset({
          name: product.name,
          subtitle: product.subtitle || "",
          slug: product.slug,
          description: product.description || "",
          categoryId: product.categoryId,
          isActive: product.isActive,
        })

        // Set images
        if (product.image) {
          setMainImage({ url: product.image, preview: product.image })
        } else {
          setMainImage(null)
        }

        if (product.images?.length > 0) {
          setGalleryImages(
            product.images.map((url, index) => ({
              id: `existing-${index}-${Date.now()}`,
              url,
              preview: url,
              isNew: false,
            }))
          )
        } else {
          setGalleryImages([])
        }

        // Set datasheets
        setDatasheets(jsonToDatasheets(product.datasheets))
      } else {
        // Create mode
        reset(defaultFormValues)
        setMainImage(null)
        setGalleryImages([])
        setDatasheets([])
      }
    }
  }, [open, product, reset])

  // Handle close
  const handleClose = () => {
    // Cleanup blob URLs
    if (mainImage?.preview?.startsWith("blob:")) {
      URL.revokeObjectURL(mainImage.preview)
    }
    galleryImages.forEach((item) => {
      if (item.preview?.startsWith("blob:")) {
        URL.revokeObjectURL(item.preview)
      }
    })

    // Reset states
    setMainImage(null)
    setGalleryImages([])
    setDatasheets([])
    resetProgress()
    setActiveTab("basic")

    onClose()
  }

  // Calculate total upload steps
  const calculateTotalSteps = () => {
    let steps = 1 // Save to DB always
    
    if (mainImage?.file) steps++
    if (galleryImages.some(item => item.isNew)) steps++
    if (datasheets.some(item => item.type === "file" && item.file && !item.value)) steps++
    
    return steps
  }

  // Submit handler
  const onSubmit = async (data: ProductFormData) => {
    // Validate main image
    if (!mainImage) {
      toast.error("กรุณาเลือกรูปหลักของสินค้า")
      setActiveTab("images")
      return
    }

    setLoading(true)
    const totalSteps = calculateTotalSteps()
    startUpload(totalSteps)

    try {
      // Step 1: Upload main image (if new)
      let mainImageUrl = mainImage.url || ""

      if (mainImage.file) {
        nextStep("MAIN_IMAGE")
        mainImageUrl = await uploadImage(mainImage)
      }

      // Step 2: Upload gallery images (preserving order)
      let galleryUrls: string[] = []

      if (galleryImages.length > 0) {
        const newImages = galleryImages.filter((item) => item.isNew)

        if (newImages.length > 0) {
          nextStep("GALLERY")
          const uploadedUrls = await uploadGallery(newImages)

          // ตรวจสอบว่า upload สำเร็จครบทุกรูป
          if (uploadedUrls.length !== newImages.length) {
            toast.error(`อัปโหลดรูปภาพไม่ครบ (${uploadedUrls.length}/${newImages.length})`)
            setLoading(false)
            resetProgress()
            return
          }

          // Map uploaded URLs back to their positions
          let uploadIndex = 0
          galleryUrls = galleryImages.map((item) => {
            if (item.isNew) {
              return uploadedUrls[uploadIndex++]
            }
            return item.url!
          })
        } else {
          galleryUrls = galleryImages
            .filter((item) => item.url)
            .map((item) => item.url!)
        }
      }

      // Step 3: Upload datasheets (if any new files)
      const finalDatasheets = [...datasheets]
      const pendingUploads = finalDatasheets.filter(
        item => item.type === "file" && item.file && !item.value
      )

      if (pendingUploads.length > 0) {
        nextStep("DATASHEETS")
        
        for (let i = 0; i < finalDatasheets.length; i++) {
          const item = finalDatasheets[i]
          
          if (item.type === "file" && item.file && !item.value) {
            try {
              const result = await uploadDatasheet(item.file)
              finalDatasheets[i] = {
                ...item,
                value: result.url,
                fileName: result.fileName,
                fileType: result.fileType,
                fileSize: result.fileSize,
                file: undefined,
              }
            } catch (error) {
              console.error(`Failed to upload ${item.fileName}`, error)
              toast.error(`ไม่สามารถอัปโหลดเอกสาร: ${item.fileName}`)
              setLoading(false)
              resetProgress()
              return
            }
          }
        }
      }

      // Step 4: Save to database
      nextStep("SAVING")

      const url = isEdit
        ? `/api/admin/products/${product!.id}`
        : "/api/admin/products"

      const submitData = {
        name: data.name,
        subtitle: data.subtitle || null,
        slug: data.slug,
        description: data.description,
        image: mainImageUrl,
        images: galleryUrls,
        datasheets: datasheetsToJson(finalDatasheets),
        categoryId: data.categoryId,
        isActive: data.isActive,
      }

      const response = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      })

      const result = await response.json()

      if (response.ok) {
        completeUpload()
        toast.success(isEdit ? "แก้ไขสินค้าสำเร็จ" : "เพิ่มสินค้าสำเร็จ")
        onSuccess()
        
        // Delay close to show success animation
        setTimeout(() => {
          handleClose()
        }, 500)
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด")
        resetProgress()
      }
    } catch (error) {
      console.error("Error saving product:", error)
      toast.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล")
      resetProgress()
    } finally {
      setLoading(false)
    }
  }

  // Check if tab has errors
  const getTabError = (tab: string): boolean => {
    switch (tab) {
      case "basic":
        return !!(errors.name || errors.subtitle || errors.slug || errors.categoryId)
      case "images":
        return !mainImage
      case "description":
        return !!errors.description
      default:
        return false
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] bg-background border-border text-foreground overflow-hidden flex flex-col">
        {/* Header */}
        <DialogHeader className="flex-shrink-0 pb-4 border-b border-border">
          <DialogTitle className="text-2xl font-bold">
            {isEdit ? "แก้ไขสินค้า" : "เพิ่มสินค้าใหม่"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {isEdit
              ? "แก้ไขข้อมูลสินค้าตามต้องการ"
              : "กรอกข้อมูลสินค้าใหม่เพื่อเพิ่มเข้าสู่ระบบ"}
          </DialogDescription>
        </DialogHeader>

        {/* Tabs Content */}
          <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab} 
          className="flex-1 min-h-0 flex flex-col overflow-hidden"
          >
            {/* Tab List */}
            <TabsList className="grid w-full grid-cols-4 bg-card border border-border p-1 h-auto rounded-lg flex-shrink-0">
              <TabsTrigger
                value="basic"
                disabled={loading}
                className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:font-semibold text-foreground hover:text-primary-foreground transition-all py-2.5 rounded-md relative"
              >
                <Info className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">ข้อมูลพื้นฐาน</span>
                {getTabError("basic") && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full" />
                )}
              </TabsTrigger>

              <TabsTrigger
                value="images"
                disabled={loading}
                className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:font-semibold text-foreground hover:text-primary-foreground transition-all py-2.5 rounded-md relative"
              >
                <ImageIcon className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">รูปภาพ</span>
                {getTabError("images") && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full" />
                )}
              </TabsTrigger>

              <TabsTrigger
                value="description"
                disabled={loading}
                className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:font-semibold text-foreground hover:text-primary-foreground transition-all py-2.5 rounded-md relative"
              >
                <FileText className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">รายละเอียด</span>
                {getTabError("description") && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full" />
                )}
              </TabsTrigger>

              <TabsTrigger
                value="datasheets"
                disabled={loading}
                className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:font-semibold text-foreground hover:text-primary-foreground transition-all py-2.5 rounded-md"
              >
                <Link2 className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">เอกสาร</span>
              </TabsTrigger>
            </TabsList>

            {/* Tab Contents - Scrollable Area */}
            <div className="flex-1 min-h-0 overflow-y-auto mt-4 pr-2 scrollbar-thin">
              <form
                onSubmit={handleSubmit(onSubmit)}
                id="product-form"
              >
                <TabsContent value="basic" className="mt-0 data-[state=inactive]:hidden">
                  <BasicInfoTab
                  register={register}
                  control={control}
                  errors={errors}
                  categories={categories}
                  loading={loading}
                />
              </TabsContent>

              <TabsContent value="images" className="mt-0 data-[state=inactive]:hidden">
                <ImagesTab
                  mainImage={mainImage}
                  onMainImageChange={setMainImage}
                  galleryImages={galleryImages}
                  onGalleryChange={setGalleryImages}
                  loading={loading}
                />
              </TabsContent>

              <TabsContent value="description" className="mt-0 data-[state=inactive]:hidden">
                <DescriptionTab
                  control={control}
                  errors={errors}
                  loading={loading}
                />
              </TabsContent>

              <TabsContent value="datasheets" className="mt-0 data-[state=inactive]:hidden">
                <DatasheetsTab
                  datasheets={datasheets}
                  onDatasheetsChange={setDatasheets}
                  loading={loading}
                />
              </TabsContent>
              </form>
            </div>
          </Tabs>

        {/* Upload Progress */}
        {progress.isUploading && (
          <div className="flex-shrink-0 pt-4">
            <UploadProgressBar progress={progress} />
          </div>
        )}

        {/* Footer */}
        <DialogFooter className="flex-shrink-0 pt-4 border-t border-border">
          <div className="flex items-center justify-between w-full">
            <p className="text-sm text-muted-foreground">
              <span className="text-destructive">*</span> จำเป็นต้องกรอก
            </p>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
                className="border-border text-foreground hover:bg-card hover:text-foreground px-6 h-11"
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                form="product-form"
                disabled={loading || !mainImage}
                className="bg-primary hover:bg-primary/90 px-8 h-11 text-base"
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isEdit ? "บันทึกการแก้ไข" : "เพิ่มสินค้า"}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}