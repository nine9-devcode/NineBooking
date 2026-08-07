export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // Layout นี้จะครอบทั้ง login และ dashboard
  // แต่ไม่มี Sidebar/Navbar เพราะจะให้แต่ละส่วนจัดการเอง

  return <>{children}</>
}
