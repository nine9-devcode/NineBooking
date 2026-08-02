"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ChevronUp, ChevronDown, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface SortOrderInputProps {
  value: number
  onChange: (value: number) => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  disabled?: boolean
  isChild?: boolean
  parentSortOrder?: number
  canMoveUp?: boolean
  canMoveDown?: boolean
  isMoving?: boolean
}

export function SortOrderInput({
  value,
  onChange,
  onMoveUp,
  onMoveDown,
  disabled = false,
  isChild = false,
  parentSortOrder,
  canMoveUp = true,
  canMoveDown = true,
  isMoving = false,
}: SortOrderInputProps) {
  const [localValue, setLocalValue] = useState(value.toString())

  useEffect(() => {
    setLocalValue(value.toString())
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setLocalValue(newValue)
  }

  const handleBlur = () => {
    const numValue = parseInt(localValue, 10)
    if (!isNaN(numValue) && numValue >= 1) {
      onChange(numValue)
    } else {
      setLocalValue(value.toString())
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur()
    }
  }

  return (
    <div className="flex items-center gap-1">
      {/* แสดง prefix สำหรับหมวดย่อย (เช่น "1.") */}
      {isChild && parentSortOrder !== undefined && (
        <span className="text-muted-foreground text-sm font-medium min-w-[20px]">
          {parentSortOrder}.
        </span>
      )}

      {/* ปุ่มลูกศร ▲▼ */}
      <div className="flex flex-col gap-0.5">
        <Button
          variant="ghost"
          size="icon"
          className="h-4 w-6 p-0 text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-30"
          onClick={onMoveUp}
          disabled={disabled || !canMoveUp || isMoving}
        >
          {isMoving ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <ChevronUp className="w-3 h-3" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-4 w-6 p-0 text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-30"
          onClick={onMoveDown}
          disabled={disabled || !canMoveDown || isMoving}
        >
          <ChevronDown className="w-3 h-3" />
        </Button>
      </div>

      <Input
        type="number"
        min="1"
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={cn(
          "w-14 h-8 text-center text-sm",
          "bg-card border-border text-foreground",
          "focus:border-primary focus:ring-1 focus:ring-primary",
          "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
          isChild && "bg-card/50"
        )}
      />
    </div>
  )
}
