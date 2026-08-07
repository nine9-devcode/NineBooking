"use client"

import { useCallback, useEffect, useState } from "react"
import { History, ShieldCheck } from "lucide-react"

import { DataPagination } from "@/components/ui/data-pagination"
import { PageHeader } from "@/components/ui/page-header"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { EmptyState, LoadingState } from "@/components/ui/states"
import { AUDIT_ACTION_LABELS, AUDIT_ENTITY_LABELS } from "@/lib/audit-actions"
import { formatDate } from "@/lib/utils"

interface AuditEntry {
  id: string
  action: string
  entityType: string
  entityId: string
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
  ip: string | null
  createdAt: string
  actor: { id: string; name: string | null; nickname: string | null; email: string }
}

interface Actor {
  id: string
  name: string | null
  nickname: string | null
}

/** แปลง { status: "PENDING" } เป็นข้อความอ่านง่าย */
function describeChange(before: unknown, after: unknown): string {
  const beforeObj = (before ?? {}) as Record<string, unknown>
  const afterObj = (after ?? {}) as Record<string, unknown>
  const keys = Object.keys(afterObj)

  if (keys.length === 0) return "—"

  return keys
    .map((key) => {
      const from = beforeObj[key]
      const to = afterObj[key]
      return from === undefined || from === null
        ? `${key}: ${String(to)}`
        : `${key}: ${String(from)} → ${String(to)}`
    })
    .join(" · ")
}

export default function AuditLogPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [actors, setActors] = useState<Actor[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [entityType, setEntityType] = useState("all")
  const [actorId, setActorId] = useState("all")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "25",
        entityType,
        actorId,
      })
      const res = await fetch(`/api/admin/audit-log?${params}`)
      if (!res.ok) throw new Error("โหลดข้อมูลไม่สำเร็จ")

      const data = await res.json()
      setEntries(data.entries)
      setActors(data.actors)
      setTotalPages(data.pagination.totalPages)
      setTotal(data.pagination.total)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [page, entityType, actorId])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="space-y-6">
      <PageHeader
        title="ประวัติการใช้งานระบบ"
        description="บันทึกว่าใครแก้ข้อมูลอะไรเมื่อไหร่ — ใช้ตรวจสอบย้อนหลังเมื่อข้อมูลผิดปกติ"
        actions={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            {total.toLocaleString("th-TH")} รายการ
          </span>
        }
      />

      <div className="flex flex-wrap gap-3">
        <Select
          value={entityType}
          onValueChange={(value) => {
            setEntityType(value)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="ประเภทข้อมูล" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกประเภท</SelectItem>
            {Object.entries(AUDIT_ENTITY_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={actorId}
          onValueChange={(value) => {
            setActorId(value)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-56">
            <SelectValue placeholder="ผู้ดำเนินการ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกคน</SelectItem>
            {actors.map((actor) => (
              <SelectItem key={actor.id} value={actor.id}>
                {actor.nickname || actor.name || actor.id}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <LoadingState />
      ) : entries.length === 0 ? (
        <EmptyState
          icon={History}
          title="ยังไม่มีประวัติการใช้งาน"
          description="บันทึกจะถูกสร้างเมื่อมีการแก้ไขข้อมูลในระบบ เช่น เปลี่ยนสถานะคำสั่งจองหรือแก้ไขสินค้า"
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">เวลา</th>
                <th className="px-4 py-3 font-medium">ผู้ดำเนินการ</th>
                <th className="px-4 py-3 font-medium">การกระทำ</th>
                <th className="px-4 py-3 font-medium">ข้อมูล</th>
                <th className="px-4 py-3 font-medium">การเปลี่ยนแปลง</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {formatDate(entry.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">
                      {entry.actor.nickname || entry.actor.name || "—"}
                    </div>
                    <div className="text-xs text-muted-foreground">{entry.actor.email}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {AUDIT_ACTION_LABELS[entry.action] ?? entry.action}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <div>{AUDIT_ENTITY_LABELS[entry.entityType] ?? entry.entityType}</div>
                    <code className="text-xs">{entry.entityId.slice(-8)}</code>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {describeChange(entry.before, entry.after)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <DataPagination page={page} totalPages={totalPages} onPageChange={setPage} />
      )}
    </div>
  )
}
