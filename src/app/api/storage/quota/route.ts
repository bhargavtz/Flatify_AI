import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getUserStorageQuota } from "@/lib/user-storage"

export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const quota = await getUserStorageQuota(userId)
  return NextResponse.json({ ok: true, quota })
}
