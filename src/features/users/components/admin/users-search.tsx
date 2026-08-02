"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Search, X, Filter, Users } from "lucide-react"

// กำหนดป้ายชื่อสำหรับประเภทสมาชิก (ถ้าไม่ได้ Import มาจาก constants)
const MEMBER_TYPE_LABELS = {
  customer: "Customer (ทั่วไป)",
  contractor: "Contractor (ผู้รับเหมา)",
  dealer: "Dealer (ตัวแทนจำหน่าย)",
 
  other: "อื่นๆ",
}

interface UsersSearchProps {
  onSearch: (value: string) => void
  onRoleChange: (value: string) => void
  onMemberTypeChange: (value: string) => void
  currentRole?: string
  currentMemberType?: string
}

export function UsersSearch({ onSearch, onRoleChange, onMemberTypeChange, currentRole, currentMemberType }: UsersSearchProps) {
  const [searchValue, setSearchValue] = useState("")
  const [roleValue, setRoleValue] = useState("all")
  const [memberTypeValue, setMemberTypeValue] = useState("all")

  useEffect(() => {
    if (currentRole !== undefined)
      setRoleValue(currentRole === "" ? "all" : currentRole)
  }, [currentRole])

  useEffect(() => {
    if (currentMemberType !== undefined)
      setMemberTypeValue(currentMemberType === "" ? "all" : currentMemberType)
  }, [currentMemberType])

  const handleSearchChange = (value: string) => {
    setSearchValue(value)
    onSearch(value)
  }

  const handleRoleChange = (value: string) => {
    setRoleValue(value)
    onRoleChange(value === "all" ? "" : value)
  }

  const handleMemberTypeChange = (value: string) => {
    setMemberTypeValue(value)
    onMemberTypeChange(value === "all" ? "" : value)
  }

  const handleClear = () => {
    setSearchValue("")
    setRoleValue("all")
    setMemberTypeValue("all")
    onSearch("")
    onRoleChange("")
    onMemberTypeChange("")
  }

  const hasFilters = searchValue || roleValue !== "all" || memberTypeValue !== "all"

  return (
    <div className="bg-card/30 border border-border rounded-xl p-4">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ค้นหาจากชื่อ, อีเมล, ชื่อเล่น หรือเบอร์โทร..."
            className="pl-10 pr-10 bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-primary"
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
          {searchValue && (
            <button
              onClick={() => handleSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filters + Clear อยู่ใน flex row เดียวกัน ไม่ wrap ทับกัน */}
        <div className="flex items-center gap-2">
          <Select value={roleValue} onValueChange={handleRoleChange}>
            <SelectTrigger className="w-[140px] bg-background border-border text-foreground focus:border-primary">
              <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="บทบาท" />
            </SelectTrigger>
            <SelectContent className="bg-background border-border">
              <SelectItem value="all" className="text-foreground">บทบาททั้งหมด</SelectItem>
              <SelectItem value="user" className="text-foreground">User (ทั่วไป)</SelectItem>
              <SelectItem value="admin" className="text-foreground">Admin (ผู้ดูแล)</SelectItem>
            </SelectContent>
          </Select>

          <Select value={memberTypeValue} onValueChange={handleMemberTypeChange}>
            <SelectTrigger className="w-[180px] bg-background border-border text-foreground focus:border-primary">
              <Users className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="ประเภทสมาชิก" />
            </SelectTrigger>
            <SelectContent className="bg-background border-border">
              <SelectItem value="all" className="text-foreground">ประเภททั้งหมด</SelectItem>
              {Object.entries(MEMBER_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value} className="text-foreground">
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasFilters && (
            <Button
              variant="outline"
              size="icon"
              onClick={handleClear}
              className="shrink-0 border-border text-muted-foreground hover:text-foreground hover:bg-card"
              title="ล้างตัวกรอง"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}