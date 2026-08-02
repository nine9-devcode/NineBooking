// Types สำหรับ Product Form Modal

import type { DatasheetItem } from "@/features/products/datasheet.types"

// Category type
export interface Category {
  id: string
  name: string
}

// Product type (from API)
export interface Product {
  id: string
  name: string
  subtitle: string | null
  slug: string
  description: string | null
  image: string | null
  images: string[]
  datasheets: any
  categoryId: string
  isActive: boolean
  createdAt?: string
  updatedAt?: string
  category?: {
    id: string
    name: string
    slug: string
  }
  _count?: {
    orderItems: number
    exclusivePairingsA?: number
    exclusivePairingsB?: number
  }
}

// Image value type
export interface ImageValue {
  file?: File
  url?: string
  preview: string
}

// Gallery item type
export interface GalleryItem {
  id: string
  file?: File
  url?: string
  preview: string
  isNew: boolean
}

// Form data type (from Zod schema)
export type { ProductFormData } from "./schema"

// Upload progress state
export interface UploadProgress {
  isUploading: boolean
  currentStep: string
  progress: number // 0-100
  totalSteps: number
  currentStepIndex: number
}

// Props สำหรับ Tabs
export interface BasicInfoTabProps {
  register: any
  control: any
  errors: any
  categories: Category[]
  loading: boolean
}

export interface ImagesTabProps {
  mainImage: ImageValue | null
  onMainImageChange: (value: ImageValue | null) => void
  galleryImages: GalleryItem[]
  onGalleryChange: (values: GalleryItem[]) => void
  loading: boolean
}

export interface DescriptionTabProps {
  control: any
  errors: any
  loading: boolean
}

export interface DatasheetsTabProps {
  datasheets: DatasheetItem[]
  onDatasheetsChange: (values: DatasheetItem[]) => void
  loading: boolean
}

// Modal props
export interface ProductFormModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  product?: Product | null
  categories: Category[]
}