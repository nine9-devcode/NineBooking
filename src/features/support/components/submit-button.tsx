import { Send } from 'lucide-react'

interface SubmitButtonProps {
  onClick: () => void
  isSubmitting: boolean
  disabled?: boolean
}

export function SubmitButton({ onClick, isSubmitting, disabled }: SubmitButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isSubmitting || disabled}
      className="w-full bg-primary hover:bg-primary/10 disabled:opacity-70 disabled:cursor-not-allowed text-primary-foreground font-medium py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
    >
      {isSubmitting ? (
        'กำลังส่ง...'
      ) : (
        <>
          <Send className="w-5 h-5" />
          ส่งแจ้งปัญหา
        </>
      )}
    </button>
  )
}
