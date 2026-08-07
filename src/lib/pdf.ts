// ไฟล์: lib/pdf.ts
// PDF Generation Utility with Thai Font Support

import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer"
import { pdfTheme } from "@/config/pdf-theme"

// ลงทะเบียนฟอนต์ไทย (Sarabun)
Font.register({
  family: "Sarabun",
  fonts: [
    {
      src: process.cwd() + "/public/fonts/Sarabun-Regular.ttf",
      fontWeight: "normal",
    },
    {
      src: process.cwd() + "/public/fonts/Sarabun-Bold.ttf",
      fontWeight: "bold",
    },
    {
      src: process.cwd() + "/public/fonts/Sarabun-Italic.ttf",
      fontStyle: "italic",
    },
  ],
})

// Base styles สำหรับ PDF
export const pdfStyles = StyleSheet.create({
  page: {
    fontFamily: "Sarabun",
    fontSize: 10,
    padding: 30,
    backgroundColor: "#ffffff",
  },
  // Header
  header: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: pdfTheme.primary,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: pdfTheme.primary,
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#666666",
  },
  // Section
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 8,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#eeeeee",
  },
  // Row
  row: {
    flexDirection: "row",
    marginBottom: 4,
  },
  label: {
    width: 130,
    color: "#666666",
  },
  value: {
    flex: 1,
    color: "#333333",
  },
  // Table
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f5f5f5",
    borderBottomWidth: 1,
    borderBottomColor: "#dddddd",
    paddingVertical: 8,
    paddingHorizontal: 5,
  },
  tableHeaderCell: {
    fontWeight: "bold",
    color: "#333333",
    fontSize: 9,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eeeeee",
    paddingVertical: 8,
    paddingHorizontal: 5,
  },
  tableCell: {
    fontSize: 9,
    color: "#444444",
  },
  // Status badges
  statusPending: {
    color: "#f59e0b",
    fontWeight: "bold",
  },
  statusConfirmed: {
    color: "#3b82f6",
    fontWeight: "bold",
  },
  statusCompleted: {
    color: "#22c55e",
    fontWeight: "bold",
  },
  statusCancelled: {
    color: "#ef4444",
    fontWeight: "bold",
  },
  // Footer
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 8,
    color: "#999999",
    borderTopWidth: 1,
    borderTopColor: "#eeeeee",
    paddingTop: 10,
  },
  // Notes
  noteBox: {
    backgroundColor: "#f9fafb",
    padding: 10,
    borderRadius: 4,
    marginTop: 5,
  },
  noteText: {
    fontSize: 9,
    color: "#666666",
    lineHeight: 1.5,
  },
})

// Status text mapping
export const STATUS_TEXT: Record<string, string> = {
  PENDING: "รอดำเนินการ ",
  CONFIRMED: "ยืนยันแล้ว",
  COMPLETED: "เสร็จสิ้น",
  CANCELLED: "ยกเลิก",
}

// Get status style
export const getStatusStyle = (status: string) => {
  switch (status) {
    case "PENDING":
      return pdfStyles.statusPending
    case "CONFIRMED":
      return pdfStyles.statusConfirmed
    case "COMPLETED":
      return pdfStyles.statusCompleted
    case "CANCELLED":
      return pdfStyles.statusCancelled
    default:
      return {}
  }
}

// Format date to Thai
export const formatThaiDate = (date: Date | string): string => {
  const d = new Date(date)
  const thaiMonths = [
    "มกราคม",
    "กุมภาพันธ์",
    "มีนาคม",
    "เมษายน",
    "พฤษภาคม",
    "มิถุนายน",
    "กรกฎาคม",
    "สิงหาคม",
    "กันยายน",
    "ตุลาคม",
    "พฤศจิกายน",
    "ธันวาคม",
  ]
  const day = d.getDate()
  const month = thaiMonths[d.getMonth()]
  const year = d.getFullYear() + 543 // พ.ศ.
  return `${day} ${month} ${year}`
}

// Format date short
export const formatShortDate = (date: Date | string): string => {
  const d = new Date(date)
  const day = d.getDate().toString().padStart(2, "0")
  const month = (d.getMonth() + 1).toString().padStart(2, "0")
  const year = (d.getFullYear() + 543).toString().slice(-2)
  return `${day}/${month}/${year}`
}

// Export components for reuse
export { Document, Page, Text, View, StyleSheet, Font }
