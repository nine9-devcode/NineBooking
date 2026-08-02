import { requireUser } from "@/lib/api/guards"
import { apiOk, handleApiError } from "@/lib/api/response"
import { prisma } from "@/lib/db"
import { completeProfileSchema } from "@/features/auth/schema"

// POST /api/user/complete-profile — กรอกข้อมูลที่ยังขาดให้ครบก่อนเริ่มใช้งาน
export async function POST(request: Request) {
  try {
    const guard = await requireUser()
    if (!guard.ok) return guard.response

    const data = completeProfileSchema.parse(await request.json())

    const user = await prisma.user.update({
      where: { id: guard.user.id },
      data: {
        name: data.name,
        nickname: data.nickname,
        phone: data.phone,
        residenceType: data.residenceType,
        isProfileCompleted: true,
        address: data.address || null,
        province: data.province || null,
        district: data.district || null,
        subDistrict: data.subDistrict || null,
        postalCode: data.postalCode || null,
      },
      select: {
        id: true,
        name: true,
        nickname: true,
        email: true,
        phone: true,
        residenceType: true,
        isProfileCompleted: true,
      },
    })

    return apiOk({ message: "บันทึกข้อมูลสำเร็จ", user })
  } catch (error) {
    return handleApiError(error, "user/complete-profile")
  }
}
