"use client"

import { useCallback, useEffect, useState } from "react"
import { History, Search, ShieldCheck, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DataPagination } from "@/components/ui/data-pagination"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PageHeader } from "@/components/ui/page-header"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { EmptyState, LoadingState } from "@/components/ui/states"
import {
  AUDIT_ACTION_LABELS,
  AUDIT_ENTITY_LABELS,
  auditFieldLabel,
  auditValueLabel,
} from "@/lib/audit-actions"
import { cn, formatDate } from "@/lib/utils"

interface AuditEntry {
  id: string
  action: string
  entityType: string
  entityId: string
  entityLabel: string | null
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
  ip: string | null
  createdAt: string
  actor: { id: string; name: string | null; nickname: string | null; email: string }
}

/** แปลง { status: "PENDING" } เป็น "สถานะ: รอดำเนินการ → ยืนยันแล้ว" */
function describeChange(before: unknown, after: unknown): string {
  const beforeObj = (before ?? {}) as Record<string, unknown>
  const afterObj = (after ?? {}) as Record<string, unknown>
  const keys = Object.keys(afterObj)

  if (keys.length === 0) return "—"

  return keys
    .map((key) => {
      const label = auditFieldLabel(key)
      const to = auditValueLabel(afterObj[key])
      const from = beforeObj[key]

      return from === undefined || from === null
        ? `${label}: ${to}`
        : `${label}: ${auditValueLabel(from)} → ${to}`
    })
    .join(" · ")
}

/**
 * ค่าที่กดได้ในตาราง
 *
 * แทนที่จะมี dropdown แยกสำหรับทุกมิติ ให้กดค่าที่เห็นอยู่แล้วเพื่อกรองด้วยค่านั้น
 * เป็นแพตเทิร์นมาตรฐานของหน้า log — ลดตัวควบคุมบนหัวตารางและค้นหาได้ตรงกว่า
 */
function FilterableCell({
  onClick,
  title,
  className,
  children,
}: {
  onClick: () => void
  title: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={cn(
        "rounded text-left underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        className
      )}
    >
      {children}
    </button>
  )
}

export default function AuditLogPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const [q, setQ] = useState("")
  const [entityType, setEntityType] = useState("all")
  const [actorId, setActorId] = useState("all")
  const [actorLabel, setActorLabel] = useState("")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "25",
        entityType,
        actorId,
        ...(q && { q }),
        ...(from && { from }),
        ...(to && { to }),
      })
      const res = await fetch(`/api/admin/audit-log?${params}`)
      if (!res.ok) throw new Error("โหลดข้อมูลไม่สำเร็จ")

      const data = await res.json()
      setEntries(data.entries)
      setTotalPages(data.pagination.totalPages)
      setTotal(data.pagination.total)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [page, entityType, actorId, q, from, to])

  useEffect(() => {
    void load()
  }, [load])

  function filterByActor(entry: AuditEntry) {
    setActorId(entry.actor.id)
    setActorLabel(entry.actor.nickname || entry.actor.name || entry.actor.email)
    setPage(1)
  }

  function clearAll() {
    setQ("")
    setEntityType("all")
    setActorId("all")
    setActorLabel("")
    setFrom("")
    setTo("")
    setPage(1)
  }

  const chips = [
    q && { key: "q", label: `ค้นหา: ${q}`, clear: () => setQ("") },
    entityType !== "all" && {
      key: "entityType",
      label: `ประเภท: ${AUDIT_ENTITY_LABELS[entityType] ?? entityType}`,
      clear: () => setEntityType("all"),
    },
    actorId !== "all" && {
      key: "actor",
      label: `ผู้ดำเนินการ: ${actorLabel}`,
      clear: () => {
        setActorId("all")
        setActorLabel("")
      },
    },
    from && { key: "from", label: `ตั้งแต่ ${from}`, clear: () => setFrom("") },
    to && { key: "to", label: `ถึง ${to}`, clear: () => setTo("") },
  ].filter(Boolean) as Array<{ key: string; label: string; clear: () => void }>

  return (
    <div className="space-y-6">
      <PageHeader
        title="ประวัติการใช้งานระบบ"
        description="บันทึกว่าใครแก้ข้อมูลอะไรเมื่อไหร่ — กดค่าในตารางเพื่อกรองเฉพาะค่านั้น"
        actions={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            {total.toLocaleString("th-TH")} รายการ
          </span>
        }
      />

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="audit-q" className="text-xs text-muted-foreground">
            ค้นหา
          </Label>
          <div className="relative">
            <Search
              className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="audit-q"
              value={q}
              onChange={(event) => {
                setQ(event.target.value)
                setPage(1)
              }}
              placeholder="เลขที่เอกสาร ชื่อสินค้า หรือชื่อผู้ดำเนินการ"
              className="w-72 pl-9"
            />
          </div>
        </div>

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

        <div className="space-y-1.5">
          <Label htmlFor="audit-from" className="text-xs text-muted-foreground">
            ตั้งแต่วันที่
          </Label>
          <Input
            id="audit-from"
            type="date"
            value={from}
            max={to || undefined}
            onChange={(event) => {
              setFrom(event.target.value)
              setPage(1)
            }}
            className="w-40"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="audit-to" className="text-xs text-muted-foreground">
            ถึงวันที่
          </Label>
          <Input
            id="audit-to"
            type="date"
            value={to}
            min={from || undefined}
            onChange={(event) => {
              setTo(event.target.value)
              setPage(1)
            }}
            className="w-40"
          />
        </div>
      </div>

      {/* ตัวกรองที่ใช้อยู่ — จำเป็นเพราะบางตัวมาจากการกดในตาราง ไม่ได้มีช่องให้เห็น */}
      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {chips.map((chip) => (
            <span
              key={chip.key}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-xs text-foreground"
            >
              {chip.label}
              <button
                type="button"
                onClick={() => {
                  chip.clear()
                  setPage(1)
                }}
                aria-label={`เอาตัวกรอง ${chip.label} ออก`}
                className="rounded-full text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </span>
          ))}

          <Button variant="ghost" size="sm" onClick={clearAll}>
            ล้างทั้งหมด
          </Button>
        </div>
      )}

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
                    <FilterableCell
                      onClick={() => filterByActor(entry)}
                      title={`กรองเฉพาะการกระทำของ ${entry.actor.nickname || entry.actor.name || entry.actor.email}`}
                    >
                      <span className="font-medium text-foreground">
                        {entry.actor.nickname || entry.actor.name || "—"}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {entry.actor.email}
                      </span>
                    </FilterableCell>
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    {AUDIT_ACTION_LABELS[entry.action] ?? entry.action}
                  </td>

                  <td className="px-4 py-3 text-muted-foreground">
                    <FilterableCell
                      onClick={() => {
                        setEntityType(entry.entityType)
                        setPage(1)
                      }}
                      title={`กรองเฉพาะ${AUDIT_ENTITY_LABELS[entry.entityType] ?? entry.entityType}`}
                    >
                      {AUDIT_ENTITY_LABELS[entry.entityType] ?? entry.entityType}
                    </FilterableCell>

                    {/* entityId เป็น cuid ที่ไม่มีใครจำได้ — โชว์ชื่อที่บันทึกไว้แทน
                        ถ้าเป็นบันทึกเก่าที่ยังไม่มี ค่อยตกกลับไปโชว์ id ท้าย 8 ตัว */}
                    <span className="block text-xs">
                      {entry.entityLabel ? (
                        <FilterableCell
                          onClick={() => {
                            setQ(entry.entityLabel ?? "")
                            setPage(1)
                          }}
                          title={`ดูทุกอย่างที่เกิดกับ ${entry.entityLabel}`}
                          className="text-foreground"
                        >
                          {entry.entityLabel}
                        </FilterableCell>
                      ) : (
                        <code>{entry.entityId.slice(-8)}</code>
                      )}
                    </span>
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
