"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { User, MapPin, Lock, Trash2, AlertTriangle } from "lucide-react"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { ProfileAvatar } from "@/features/users/components/profile/profile-avatar"
import { ProfileCard } from "@/features/users/components/profile/profile-card"
import { ProfileInfoDisplay } from "@/features/users/components/profile/profile-info-display"
import { EditBasicInfoModal } from "@/features/users/components/profile/modals/edit-basic-info-modal"
import { EditAddressModal } from "@/features/users/components/profile/modals/edit-address-modal"
import { EditPasswordModal } from "@/features/users/components/profile/modals/edit-password-modal"
import { getResidenceTypeLabel } from "@/lib/constants"
import { toast } from "sonner"

interface UserProfile {
  name: string
  nickname: string | null
  email: string
  phone: string | null
  image: string | null
  residenceType: string | null
  address: string | null
  province: string | null
  district: string | null
  subDistrict: string | null
  postalCode: string | null
}

function ProfileSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Header skeleton */}
      <div className="lg:col-span-full bg-card rounded-lg shadow-md p-6 animate-pulse">
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
          <div className="w-32 h-32 rounded-full bg-secondary" />
          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="h-6 w-48 bg-secondary rounded mx-auto sm:mx-0" />
            <div className="h-4 w-32 bg-muted rounded mx-auto sm:mx-0" />
            <div className="h-6 w-28 bg-muted rounded-full mx-auto sm:mx-0" />
          </div>
        </div>
      </div>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-card rounded-lg shadow-md p-6 animate-pulse">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 bg-secondary rounded-lg" />
            <div className="h-5 w-24 bg-secondary rounded" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="h-3 w-16 bg-muted rounded" />
              <div className="h-4 w-28 bg-secondary rounded" />
            </div>
            <div className="space-y-1">
              <div className="h-3 w-16 bg-muted rounded" />
              <div className="h-4 w-24 bg-secondary rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function ProfilePage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)

  const [editBasicOpen, setEditBasicOpen] = useState(false)
  const [editAddressOpen, setEditAddressOpen] = useState(false)
  const [editPasswordOpen, setEditPasswordOpen] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      fetchProfile()
    }
  }, [session])

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/user/profile")
      const data = await response.json()

      if (response.ok) {
        setProfile(data.user)
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
      toast.error("ไม่สามารถโหลดข้อมูลโปรไฟล์ได้")
    }
  }

  if (status === "loading" || !profile) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar currentPage="โปรไฟล์ของฉัน" />
        <div className="flex-1 bg-muted pt-16">
          <div className="max-w-5xl mx-auto px-4 py-8">
            <div className="h-8 w-48 bg-secondary rounded animate-pulse mb-8" />
            <ProfileSkeleton />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar currentPage="โปรไฟล์ของฉัน" />
      <div className="flex-1 bg-muted pt-16">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold font-heading mb-8">โปรไฟล์ของฉัน</h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Header Card - full width */}
            <div className="lg:col-span-full bg-card rounded-lg shadow-md p-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-center gap-4 sm:gap-6">
                <ProfileAvatar
                  name={profile.name}
                  image={profile.image}
                  size="lg"
                />
                <div className="flex-1 text-center sm:text-left">
                  <h2 className="text-xl sm:text-2xl font-bold font-heading mb-1">{profile.name}</h2>
                  {profile.nickname && (
                    <p className="text-muted-foreground text-sm mb-1">({profile.nickname})</p>
                  )}
                  <p className="text-muted-foreground mb-3 text-sm sm:text-base">{profile.email}</p>
                </div>
              </div>
            </div>

            {/* Card 1: ข้อมูลส่วนตัว */}
            <ProfileCard
              title="ข้อมูลส่วนตัว"
              icon={User}
              onEdit={() => setEditBasicOpen(true)}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ProfileInfoDisplay label="ชื่อ-นามสกุล" value={profile.name} />
                <ProfileInfoDisplay label="ชื่อเล่น" value={profile.nickname} />
                <div className="md:col-span-2">
                  <ProfileInfoDisplay label="อีเมล" value={profile.email} />
                </div>
                <ProfileInfoDisplay label="เบอร์โทรศัพท์" value={profile.phone} />
              </div>
            </ProfileCard>

            {/* Card 2: ที่อยู่จัดส่ง */}
            <ProfileCard
              title="ที่อยู่จัดส่ง"
              icon={MapPin}
              onEdit={() => setEditAddressOpen(true)}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ProfileInfoDisplay
                  label="ประเภทที่อยู่อาศัย"
                  value={profile.residenceType ? getResidenceTypeLabel(profile.residenceType) : null}
                />
                <ProfileInfoDisplay label="ที่อยู่" value={profile.address} />
                <ProfileInfoDisplay label="จังหวัด" value={profile.province} />
                <ProfileInfoDisplay label="อำเภอ/เขต" value={profile.district} />
                <ProfileInfoDisplay label="ตำบล/แขวง" value={profile.subDistrict} />
                <ProfileInfoDisplay label="รหัสไปรษณีย์" value={profile.postalCode} />
              </div>
            </ProfileCard>

            {/* Card 3: ความปลอดภัย */}
            <ProfileCard
              title="ความปลอดภัย"
              icon={Lock}
              onEdit={() => setEditPasswordOpen(true)}
            >
              <p className="text-muted-foreground">คุณสามารถเปลี่ยนรหัสผ่านของคุณได้</p>
            </ProfileCard>

            {/* Danger Zone: ลบบัญชี */}
            <div className="bg-card rounded-lg shadow-md border border-destructive/40 overflow-hidden">
              <div className="bg-destructive/10 px-6 py-4 border-b border-destructive/40">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  <h3 className="font-semibold text-destructive">ลบบัญชี</h3>
                </div>
              </div>
              <div className="p-6">
                <p className="text-muted-foreground mb-4">
                  หากต้องการลบบัญชีและข้อมูลทั้งหมดของคุณ กรุณาส่งคำขอผ่านหน้าแจ้งปัญหา
                  ผู้ดูแลระบบจะดำเนินการให้ การลบข้อมูลไม่สามารถยกเลิกได้
                </p>
                <Link
                  href="/support"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-card border border-destructive/40 text-destructive rounded-lg hover:bg-destructive/10 transition-colors text-sm font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  ส่งคำขอลบบัญชี
                </Link>
              </div>
            </div>
          </div>

          {/* Modals */}
          <EditBasicInfoModal
            open={editBasicOpen}
            onOpenChange={setEditBasicOpen}
            profile={profile}
            onSuccess={() => {
              fetchProfile()
              update()
            }}
          />

          <EditAddressModal
            open={editAddressOpen}
            onOpenChange={setEditAddressOpen}
            profile={profile}
            onSuccess={fetchProfile}
          />

          <EditPasswordModal
            open={editPasswordOpen}
            onOpenChange={setEditPasswordOpen}
          />
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  )
}
