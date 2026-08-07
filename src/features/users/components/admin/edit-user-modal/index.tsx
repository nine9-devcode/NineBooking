// components/admin/users/edit-user-modal/index.tsx
"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, MapPin, Loader2, Save } from "lucide-react"
import { provinces, districts, subDistricts } from "@/lib/thailand-addresses"

import { editUserSchema, EditUserFormValues, EditUserModalProps } from "./schema"
import { PersonalInfoTab } from "./personal-info-tab"
import { AddressTab } from "./address-tab"

export function EditUserModal({
  isOpen,
  user,
  onClose,
  onSave,
  isLoading,
}: EditUserModalProps) {
  const form = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      id: "",
      name: "",
      nickname: "",
      email: "",
      phone: "",
      memberType: "customer",
      memberTypeNote: "",
      residenceType: "",
      address: "",
      province: "",
      district: "",
      subDistrict: "",
      postalCode: "",
      provinceCode: "",
      districtCode: "",
      subDistrictCode: "",
    },
  })

  // Reset form when user changes
  useEffect(() => {
    if (user && isOpen) {
      // Reverse lookup: ชื่อ → Code (สำหรับ dropdown)
      let provinceCode = ""
      let districtCode = ""
      let subDistrictCode = ""

      if (user.province) {
        const p = provinces.find((p) => p.nameTh === user.province)
        if (p) {
          provinceCode = p.code.toString()

          if (user.district) {
            const d = districts.find(
              (d) => d.provinceCode === p.code && d.nameTh === user.district
            )
            if (d) {
              districtCode = d.code.toString()

              if (user.subDistrict) {
                const sd = subDistricts.find(
                  (sd) => sd.districtCode === d.code && sd.nameTh === user.subDistrict
                )
                if (sd) {
                  subDistrictCode = sd.code.toString()
                }
              }
            }
          }
        }
      }

      form.reset({
        id: user.id,
        name: user.name || "",
        nickname: user.nickname || "",
        email: user.email || "",
        phone: user.phone || "",
        memberType: user.memberType || "customer",
        memberTypeNote: user.memberTypeNote || "",
        residenceType: user.residenceType || "",
        address: user.address || "",
        province: user.province || "",
        district: user.district || "",
        subDistrict: user.subDistrict || "",
        postalCode: user.postalCode || "",
        provinceCode,
        districtCode,
        subDistrictCode,
      })
    }
  }, [user, isOpen, form])

  const handleClose = () => {
    form.reset()
    onClose()
  }

  // กรอง data ก่อนส่ง
  const handleSave = (data: EditUserFormValues) => {
    // Block ถ้ายังไม่ได้กรอก residenceType
    if (data.residenceType === "other") {
      form.setError("residenceType", {
        type: "manual",
        message: "กรุณาระบุประเภทที่อยู่อาศัย",
      })
      return
    }

    const { provinceCode, districtCode, subDistrictCode, ...saveData } = data
    onSave(saveData as EditUserFormValues)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] sm:w-auto max-w-2xl bg-background border-border text-foreground max-h-[90vh] flex flex-col">
        <DialogHeader className="border-b border-border pb-4 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <User className="w-5 h-5 text-primary" />
            แก้ไขข้อมูลสมาชิก
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSave)}
            className="flex flex-col flex-1 overflow-hidden"
          >
            <Tabs defaultValue="personal" className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="grid w-full grid-cols-2 bg-card flex-shrink-0">
                <TabsTrigger
                  value="personal"
                  className="text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2"
                >
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">ข้อมูลส่วนตัว</span>
                  <span className="sm:hidden">ส่วนตัว</span>
                </TabsTrigger>
                <TabsTrigger
                  value="address"
                  className="text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2"
                >
                  <MapPin className="w-4 h-4" />
                  <span className="hidden sm:inline">ข้อมูลที่อยู่</span>
                  <span className="sm:hidden">ที่อยู่</span>
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-y-auto mt-4 px-1">
                <TabsContent value="personal" className="mt-0 h-full">
                  <PersonalInfoTab form={form} />
                </TabsContent>

                <TabsContent value="address" className="mt-0 h-full">
                  <AddressTab form={form} />
                </TabsContent>
              </div>
            </Tabs>

            <DialogFooter className="mt-6 pt-4 border-t border-border flex-shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="bg-card border-border text-foreground hover:bg-secondary hover:text-foreground"
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-primary hover:bg-primary/90"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    กำลังบันทึก...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    บันทึก
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
