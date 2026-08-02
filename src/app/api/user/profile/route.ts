import { requireUser } from "@/lib/api/guards"
import { apiOk, handleApiError, notFound } from "@/lib/api/response"
import { prisma } from "@/lib/db"
import { updateProfileSchema } from "@/features/auth/schema"

const PROFILE_FIELDS = {
  id: true,
  name: true,
  nickname: true,
  email: true,
  phone: true,
  image: true,
  residenceType: true,
  address: true,
  province: true,
  district: true,
  subDistrict: true,
  postalCode: true,
} as const

// GET /api/user/profile
export async function GET() {
  try {
    const guard = await requireUser()
    if (!guard.ok) return guard.response

    const user = await prisma.user.findUnique({
      where: { id: guard.user.id },
      select: PROFILE_FIELDS,
    })

    if (!user) return notFound("ข้อมูลผู้ใช้")

    return apiOk({ user })
  } catch (error) {
    return handleApiError(error, "user/profile:get")
  }
}

// PATCH /api/user/profile — แก้ข้อมูลโปรไฟล์ของตัวเอง
export async function PATCH(request: Request) {
  try {
    const guard = await requireUser()
    if (!guard.ok) return guard.response

    const data = updateProfileSchema.parse(await request.json())

    // ส่งมาเฉพาะฟิลด์ที่ต้องการแก้ — ค่า undefined ถูกละไว้
    const user = await prisma.user.update({
      where: { id: guard.user.id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.nickname !== undefined && { nickname: data.nickname }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.residenceType !== undefined && {
          residenceType: data.residenceType,
        }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.province !== undefined && { province: data.province }),
        ...(data.district !== undefined && { district: data.district }),
        ...(data.subDistrict !== undefined && { subDistrict: data.subDistrict }),
        ...(data.postalCode !== undefined && { postalCode: data.postalCode }),
      },
      select: PROFILE_FIELDS,
    })

    return apiOk({ message: "อัปเดตข้อมูลสำเร็จ", user })
  } catch (error) {
    return handleApiError(error, "user/profile:update")
  }
}
