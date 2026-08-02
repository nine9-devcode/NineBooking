/**
 * โลโก้แบบ inline SVG ไม่ใช่ <img>
 *
 * ต้องเป็น inline เพราะคำว่า "Nine" ใช้ currentColor เพื่อให้เปลี่ยนตามธีม
 * ถ้าโหลดผ่าน <img src="logo.svg"> ตัว SVG จะอยู่คนละ document
 * currentColor จะกลายเป็นสีดำเสมอ อ่านไม่ออกบนพื้นเข้ม
 */
export function Logo({
  width = 180,
  height = 42,
  className,
}: {
  width?: number
  height?: number
  className?: string
}) {
  return (
    <svg
      viewBox="0 0 240 56"
      width={width}
      height={height}
      className={className}
      role="img"
      aria-label="NineBooking"
    >
      <defs>
        <linearGradient id="nb-logo-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6d9bff" />
          <stop offset="100%" stopColor="#3a63d8" />
        </linearGradient>
      </defs>

      <rect x="0" y="4" width="48" height="48" rx="12" fill="url(#nb-logo-mark)" opacity="0.18" />
      <path
        d="M14 40V16l20 24V16"
        fill="none"
        stroke="url(#nb-logo-mark)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <text
        x="62"
        y="36"
        fontFamily="var(--font-prompt), 'Segoe UI', system-ui, sans-serif"
        fontSize="24"
        fontWeight="600"
        fill="currentColor"
      >
        Nine
        <tspan fill="#6d9bff">Booking</tspan>
      </text>
    </svg>
  )
}
