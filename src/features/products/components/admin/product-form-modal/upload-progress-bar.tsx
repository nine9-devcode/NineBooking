"use client"

import { Loader2, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { UploadProgress } from "./types"

interface UploadProgressBarProps {
  progress: UploadProgress
}

export function UploadProgressBar({ progress }: UploadProgressBarProps) {
  if (!progress.isUploading) return null

  const isComplete = progress.progress === 100

  return (
    <div className="space-y-3 p-4 bg-card/80 rounded-lg border border-border">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isComplete ? (
            <CheckCircle2 className="w-5 h-5 text-success" />
          ) : (
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
          )}
          <span className={cn(
            "text-sm font-medium",
            isComplete ? "text-success" : "text-foreground"
          )}>
            {progress.currentStep}
          </span>
        </div>
        <span className={cn(
          "text-sm font-bold",
          isComplete ? "text-success" : "text-primary"
        )}>
          {progress.progress}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-secondary rounded-full h-2.5 overflow-hidden">
        <div
          className={cn(
            "h-full transition-all duration-300 ease-out rounded-full",
            isComplete ? "bg-success" : "bg-primary"
          )}
          style={{ width: `${progress.progress}%` }}
        />
      </div>

      {/* Step indicator */}
      {!isComplete && progress.totalSteps > 1 && (
        <p className="text-xs text-muted-foreground text-center">
          ขั้นตอน {progress.currentStepIndex} จาก {progress.totalSteps}
        </p>
      )}
    </div>
  )
}