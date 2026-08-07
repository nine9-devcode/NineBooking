// components/admin/users/edit-user-modal/address-tab.tsx
"use client"

import { UseFormReturn } from "react-hook-form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { provinces } from "@/lib/thailand-addresses"
import { MapPin } from "lucide-react"
import { EditUserFormValues } from "./schema"
import { useAddress } from "./use-address"

interface AddressTabProps {
  form: UseFormReturn<EditUserFormValues>
}

export function AddressTab({ form }: AddressTabProps) {
  const {
    watchedProvinceCode,
    watchedDistrictCode,
    filteredDistricts,
    filteredSubDistricts,
    handleProvinceChange,
    handleDistrictChange,
    handleSubDistrictChange,
  } = useAddress(form)

  return (
    <div className="space-y-6 py-2">
      {/* Info message */}
      <div className="flex items-center gap-2 p-3 bg-card/50 rounded-lg border border-border">
        <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <p className="text-sm text-muted-foreground">
          ข้อมูลที่อยู่ไม่บังคับกรอก สามารถข้ามได้
        </p>
      </div>

      {/* ที่อยู่ */}
      <FormField
        control={form.control}
        name="address"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-foreground">
              ที่อยู่ (บ้านเลขที่, หมู่, ซอย, ถนน)
            </FormLabel>
            <FormControl>
              <Input
                {...field}
                placeholder="เช่น 123/45 หมู่ 6 ซอยสุขุมวิท 71 ถนนสุขุมวิท"
                className="bg-card border-border text-foreground focus:border-primary"
              />
            </FormControl>
            <FormMessage className="text-destructive" />
          </FormItem>
        )}
      />

      {/* Row 1: Province + District */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* จังหวัด */}
        <FormField
          control={form.control}
          name="provinceCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">จังหวัด</FormLabel>
              <Select
                key={`province-${field.value}`}
                onValueChange={handleProvinceChange}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger className="bg-card border-border text-foreground focus:border-primary min-w-0">
                    <SelectValue placeholder="เลือกจังหวัด" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-card border-border max-h-60">
                  {provinces.map((p) => (
                    <SelectItem
                      key={p.id}
                      value={p.code.toString()}
                      className="text-foreground hover:bg-secondary focus:bg-secondary"
                    >
                      {p.nameTh}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        {/* อำเภอ/เขต */}
        <FormField
          control={form.control}
          name="districtCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">อำเภอ/เขต</FormLabel>
              <Select
                key={`district-${field.value}`}
                disabled={!watchedProvinceCode}
                onValueChange={handleDistrictChange}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger className="bg-card border-border text-foreground focus:border-primary disabled:opacity-50 min-w-0">
                    <SelectValue
                      placeholder={watchedProvinceCode ? "เลือกอำเภอ/เขต" : "เลือกจังหวัดก่อน"}
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-card border-border max-h-60">
                  {filteredDistricts.map((d) => (
                    <SelectItem
                      key={d.id}
                      value={d.code.toString()}
                      className="text-foreground hover:bg-secondary focus:bg-secondary"
                    >
                      {d.nameTh}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
      </div>

      {/* Row 2: SubDistrict + PostalCode */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* ตำบล/แขวง */}
        <FormField
          control={form.control}
          name="subDistrictCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">ตำบล/แขวง</FormLabel>
              <Select
                key={`subdistrict-${field.value}`}
                disabled={!watchedDistrictCode}
                onValueChange={handleSubDistrictChange}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger className="bg-card border-border text-foreground focus:border-primary disabled:opacity-50 min-w-0">
                    <SelectValue
                      placeholder={watchedDistrictCode ? "เลือกตำบล/แขวง" : "เลือกอำเภอก่อน"}
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-card border-border max-h-60">
                  {filteredSubDistricts.map((sd) => (
                    <SelectItem
                      key={sd.id}
                      value={sd.code.toString()}
                      className="text-foreground hover:bg-secondary focus:bg-secondary"
                    >
                      {sd.nameTh}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        {/* รหัสไปรษณีย์ */}
        <FormField
          control={form.control}
          name="postalCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">รหัสไปรษณีย์</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  disabled
                  placeholder="เลือกตำบลเพื่อแสดงรหัส"
                  className="bg-card/50 border-border text-muted-foreground"
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}
