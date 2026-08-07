/**
 * สีของกราฟใน dashboard
 *
 * Recharts รับสีผ่าน prop เป็นสตริง (`stroke`, `fill`, `contentStyle`) และบางส่วน
 * ลงไปถึง <linearGradient> ใน SVG ซึ่งอ่าน `var(--chart-1)` ไม่ได้อย่างที่คาด
 * จึงเก็บเป็น hex ไว้ที่นี่แบบเดียวกับ pdf-theme.ts
 *
 * ⚠️ ค่าพวกนี้เป็นคู่แฝดของโทเคน --chart-* กับ --border/--popover ใน globals.css
 * แก้ที่ไหนต้องแก้อีกที่ให้ตรงกัน (ที่นี่คือค่า oklch ชุดนั้นแปลงเป็น sRGB แล้ว)
 */
export const chartTheme = {
  /** ลำดับสีของชุดข้อมูล — ตรงกับ --chart-1 ถึง --chart-5 */
  series: [
    "#5b8cf5", // --chart-1 น้ำเงินหลัก
    "#4bb3e8", // --chart-2 ฟ้า
    "#3fc0b4", // --chart-3 เขียวอมฟ้า
    "#a274ee", // --chart-4 ม่วง
    "#e0a63f", // --chart-5 เหลืองอำพัน
  ],

  /** ไล่เฉดของสีเดียว ใช้กับกราฟวงกลมที่มีหลายชิ้นในชุดเดียว */
  ramp: ["#7ba4f7", "#5b8cf5", "#4470d8", "#3557b0", "#28418a"],

  grid: "#2c3654",
  axis: "#8f9cbd",
  axisLine: "#3a4568",

  tooltipBg: "#1b2238",
  tooltipBorder: "#2c3654",
  tooltipText: "#f2f4fb",

  /** สีสื่อความหมาย ใช้ตอนกราฟต้องสื่อสถานะ ไม่ใช่แค่แยกชุดข้อมูล */
  success: "#4ec98a",
  warning: "#e8b84b",
  destructive: "#f2705f",
  info: "#5aa9f0",
} as const

/** วนสีเมื่อชุดข้อมูลมีมากกว่าสีที่เตรียมไว้ */
export function seriesColor(index: number): string {
  return chartTheme.series[index % chartTheme.series.length]
}

export function rampColor(index: number): string {
  return chartTheme.ramp[index % chartTheme.ramp.length]
}

/** สไตล์กล่อง tooltip ที่ทุกกราฟใช้ร่วมกัน */
export const chartTooltipStyle = {
  backgroundColor: chartTheme.tooltipBg,
  border: `1px solid ${chartTheme.tooltipBorder}`,
  borderRadius: "8px",
  color: chartTheme.tooltipText,
} as const
