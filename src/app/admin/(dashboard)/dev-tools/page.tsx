"use client"

import { useCallback, useEffect, useState } from "react"
import { AlertTriangle, Database, Play, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { PageHeader } from "@/components/ui/page-header"
import { LoadingState } from "@/components/ui/states"

interface SystemStatus {
  tables: Array<{ table: string; rows: number }>
  databaseBytes: number
  lastMigration: { name: string; finishedAt: string | null } | null
  runtime: { node: string; nodeEnv: string; mailDriver: string }
  secrets: { cronSecret: boolean; nextAuthSecret: boolean; adminEmail: boolean }
}

interface Job {
  key: string
  label: string
}

const TABLE_LABELS: Record<string, string> = {
  ProductView: "ยอดเข้าชมดิบ",
  ProductViewSummary: "ยอดเข้าชมสรุปรายวัน",
  AuditLog: "ประวัติการใช้งาน",
  RateLimit: "ตัวนับจำกัดอัตรา",
  PasswordResetToken: "ลิงก์ตั้งรหัสผ่านใหม่",
  OrderNotification: "แจ้งเตือนคำสั่งจอง (แอดมิน)",
  IssueNotification: "แจ้งเตือนเรื่องแจ้งปัญหา (แอดมิน)",
  UserOrderNotification: "แจ้งเตือนคำสั่งจอง (ลูกค้า)",
  UserSupportNotification: "แจ้งเตือนเรื่องแจ้งปัญหา (ลูกค้า)",
}

const CLEANUP_TARGETS = [
  {
    key: "productViews",
    label: "ล้างยอดเข้าชมดิบ",
    description: "ลบแถวดิบทั้งหมด — ยอดสรุปรายวันที่ใช้ทำกราฟยังอยู่ครบ",
  },
  {
    key: "notifications",
    label: "ล้างแจ้งเตือนที่อ่านแล้ว",
    description: "ลบแจ้งเตือนที่อ่านแล้วและเก่ากว่า 30 วัน ทั้งฝั่งแอดมินและลูกค้า",
  },
  {
    key: "rateLimits",
    label: "ล้างตัวนับจำกัดอัตรา",
    description: "ปลดล็อกบัญชีที่โดนล็อกจากการกรอกรหัสผิด โดยไม่ต้องรอครบเวลา",
  },
] as const

function formatBytes(bytes: number): string {
  const mb = bytes / (1024 * 1024)
  return mb >= 1024 ? `${(mb / 1024).toFixed(2)} GB` : `${mb.toFixed(1)} MB`
}

export default function DevToolsPage() {
  const [status, setStatus] = useState<SystemStatus | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState<string | null>(null)
  const [pendingCleanup, setPendingCleanup] = useState<(typeof CLEANUP_TARGETS)[number] | null>(
    null
  )

  const load = useCallback(async () => {
    try {
      const [statusRes, jobsRes] = await Promise.all([
        fetch("/api/admin/dev/status"),
        fetch("/api/admin/dev/jobs"),
      ])

      if (statusRes.ok) setStatus(await statusRes.json())
      if (jobsRes.ok) setJobs((await jobsRes.json()).jobs)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function runJob(job: string, label: string) {
    setRunning(job)
    try {
      const res = await fetch("/api/admin/dev/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job }),
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error ?? "สั่งงานไม่สำเร็จ")
        return
      }

      toast.success(`${label} เสร็จแล้ว (${data.durationMs} มิลลิวินาที)`)
      await load()
    } finally {
      setRunning(null)
    }
  }

  async function runCleanup(target: string) {
    const res = await fetch("/api/admin/dev/cleanup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target }),
    })
    const data = await res.json()

    if (!res.ok) {
      toast.error(data.error ?? "ล้างข้อมูลไม่สำเร็จ")
      throw new Error(data.error)
    }

    toast.success(`ลบไปทั้งหมด ${data.removed.toLocaleString("th-TH")} แถว`)
    await load()
  }

  if (loading) return <LoadingState label="กำลังอ่านสถานะระบบ..." />

  return (
    <div className="space-y-6">
      <PageHeader
        title="เครื่องมือระบบ"
        description="สั่งงานบำรุงรักษาและดูสถานะข้อมูล — เฉพาะผู้ดูแลระบบสูงสุด"
      />

      <div className="flex items-start gap-3 rounded-lg border border-warning/25 bg-warning/10 p-4 text-sm text-warning">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <p>
          การกระทำในหน้านี้มีผลกับข้อมูลจริงทันทีและย้อนกลับไม่ได้
          ทุกครั้งที่กดจะถูกบันทึกลงประวัติการใช้งานพร้อมชื่อผู้กด
        </p>
      </div>

      {/* ── สถานะระบบ ── */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-medium text-foreground">
          <Database className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          สถานะระบบ
        </h2>

        {status && (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatBox label="ขนาดฐานข้อมูล" value={formatBytes(status.databaseBytes)} />
              <StatBox label="Node" value={status.runtime.node} />
              <StatBox label="โหมด" value={status.runtime.nodeEnv} />
              <StatBox label="ช่องทางอีเมล" value={status.runtime.mailDriver} />
            </div>

            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[420px] text-sm">
                <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">ตาราง</th>
                    <th className="px-4 py-3 text-right font-medium">จำนวนแถว (โดยประมาณ)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {status.tables.map((row) => (
                    <tr key={row.table}>
                      <td className="px-4 py-2.5">
                        {TABLE_LABELS[row.table] ?? row.table}
                        <code className="ml-2 text-xs text-muted-foreground">{row.table}</code>
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums">
                        {row.rows.toLocaleString("th-TH")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-xs text-muted-foreground">
              จำนวนแถวเป็นค่าประมาณจากสถิติของ PostgreSQL (ไม่ได้นับทีละแถว
              เพราะการนับแบบเป๊ะต้องอ่านทั้งตาราง)
              {status.lastMigration && ` · migration ล่าสุด: ${status.lastMigration.name}`}
            </p>
          </>
        )}
      </section>

      {/* ── สั่งรันงานตามเวลา ── */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-medium text-foreground">
          <Play className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          สั่งรันงานตามเวลา
        </h2>
        <p className="text-sm text-muted-foreground">
          งานชุดเดียวกับที่ <code>/api/cron</code> เรียกตามตาราง — กดที่นี่เพื่อรันทันที
        </p>

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => runJob("all", "งานทั้งหมด")} disabled={running !== null}>
            <Play className="h-4 w-4" aria-hidden="true" />
            รันทั้งหมด
          </Button>

          {jobs.map((job) => (
            <Button
              key={job.key}
              variant="outline"
              onClick={() => runJob(job.key, job.label)}
              disabled={running !== null}
            >
              {job.label}
            </Button>
          ))}
        </div>
      </section>

      {/* ── ล้างข้อมูล ── */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-medium text-foreground">
          <Trash2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          ล้างข้อมูลที่โตเรื่อยๆ
        </h2>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CLEANUP_TARGETS.map((target) => (
            <div
              key={target.key}
              className="flex flex-col justify-between gap-3 rounded-lg border border-border bg-card p-4"
            >
              <div>
                <h3 className="font-medium text-foreground">{target.label}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{target.description}</p>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="self-start text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setPendingCleanup(target)}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                ล้างข้อมูล
              </Button>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">
          ไม่มีปุ่มล้างประวัติการใช้งานโดยเจตนา — ถ้าลบร่องรอยตัวเองได้ในคลิกเดียว
          บันทึกทั้งหมดก็เชื่อถือไม่ได้ ระบบลบของที่เก่ากว่า 1 ปีให้อัตโนมัติอยู่แล้ว
        </p>
      </section>

      <ConfirmDialog
        open={pendingCleanup !== null}
        onOpenChange={(open) => !open && setPendingCleanup(null)}
        title={`${pendingCleanup?.label ?? "ล้างข้อมูล"}?`}
        description={`${pendingCleanup?.description ?? ""} การกระทำนี้ย้อนกลับไม่ได้ และจะถูกบันทึกลงประวัติการใช้งาน`}
        confirmLabel="ล้างข้อมูล"
        onConfirm={() => runCleanup(pendingCleanup?.key ?? "")}
      />
    </div>
  )
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium text-foreground">{value}</p>
    </div>
  )
}
