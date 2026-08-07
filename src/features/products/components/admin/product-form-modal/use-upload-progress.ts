"use client"

import { useState, useCallback, useRef } from "react"
import type { UploadProgress } from "./types"

// Upload steps
export const UPLOAD_STEPS = {
  MAIN_IMAGE: "กำลังอัปโหลดรูปหลัก...",
  GALLERY: "กำลังอัปโหลดรูปเพิ่มเติม...",
  DATASHEETS: "กำลังอัปโหลดเอกสาร...",
  SAVING: "กำลังบันทึกข้อมูล...",
  COMPLETE: "เสร็จสิ้น!",
} as const

export type UploadStep = keyof typeof UPLOAD_STEPS

interface UseUploadProgressReturn {
  progress: UploadProgress
  startUpload: (totalSteps: number) => void
  nextStep: (step: UploadStep) => void
  setStepProgress: (percent: number) => void
  completeUpload: () => void
  resetProgress: () => void
}

const initialState: UploadProgress = {
  isUploading: false,
  currentStep: "",
  progress: 0,
  totalSteps: 0,
  currentStepIndex: 0,
}

export function useUploadProgress(): UseUploadProgressReturn {
  const [progress, setProgress] = useState<UploadProgress>(initialState)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const startUpload = useCallback((totalSteps: number) => {
    setProgress({
      isUploading: true,
      currentStep: "",
      progress: 0,
      totalSteps,
      currentStepIndex: 0,
    })
  }, [])

  const nextStep = useCallback((step: UploadStep) => {
    setProgress((prev) => ({
      ...prev,
      currentStep: UPLOAD_STEPS[step],
      currentStepIndex: prev.currentStepIndex + 1,
      progress: Math.round(((prev.currentStepIndex + 1) / prev.totalSteps) * 100),
    }))
  }, [])

  const setStepProgress = useCallback((percent: number) => {
    setProgress((prev) => {
      // คำนวณ progress รวม
      const stepWeight = 100 / prev.totalSteps
      const baseProgress = (prev.currentStepIndex - 1) * stepWeight
      const currentProgress = (percent / 100) * stepWeight

      return {
        ...prev,
        progress: Math.round(baseProgress + currentProgress),
      }
    })
  }, [])

  const completeUpload = useCallback(() => {
    setProgress((prev) => ({
      ...prev,
      currentStep: UPLOAD_STEPS.COMPLETE,
      progress: 100,
    }))

    // Auto reset after 1 second
    timeoutRef.current = setTimeout(() => {
      setProgress(initialState)
      timeoutRef.current = null
    }, 1000)
  }, [])

  const resetProgress = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setProgress(initialState)
  }, [])

  return {
    progress,
    startUpload,
    nextStep,
    setStepProgress,
    completeUpload,
    resetProgress,
  }
}
