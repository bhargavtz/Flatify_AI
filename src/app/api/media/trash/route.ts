import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getTrashItems, restoreMediaItem, emptyTrash, permanentlyDeleteMediaItem } from "@/lib/user-storage"

export async function GET() {
  const { userId } = await auth()
  const effectiveUserId = userId || "guest_preview"

  const trashItems = await getTrashItems(effectiveUserId)
  return NextResponse.json({ ok: true, items: trashItems })
}

export async function POST(request: Request) {
  const { userId } = await auth()
  const effectiveUserId = userId || "guest_preview"

  try {
    const body = await request.json()
    const { action, mediaId } = body

    if (action === "restore" && mediaId) {
      const res = await restoreMediaItem(effectiveUserId, mediaId)
      return NextResponse.json({ ok: res.ok, error: res.error })
    }

    if (action === "purge" && mediaId) {
      const res = await permanentlyDeleteMediaItem(effectiveUserId, mediaId)
      return NextResponse.json({ ok: res.ok, error: res.error })
    }

    if (action === "empty") {
      const res = await emptyTrash(effectiveUserId)
      return NextResponse.json({ ok: res.ok, count: res.count })
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 })
  } catch (error) {
    console.error("Error managing trash:", error)
    return NextResponse.json({ error: "Failed to process trash request." }, { status: 500 })
  }
}
