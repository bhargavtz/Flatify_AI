import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import {
  getUserMediaItems,
  saveMediaItem,
  updateMediaItem,
  softDeleteMediaItem,
  permanentlyDeleteMediaItem,
} from "@/lib/user-storage"
import { fetchAndUploadToR2 } from "@/lib/r2"

export async function GET(request: Request) {
  const { userId } = await auth()
  const effectiveUserId = userId || "guest_preview"

  const { searchParams } = new URL(request.url)
  const kind = searchParams.get("kind") as "image" | "video" | null
  const boardId = searchParams.get("boardId") || undefined
  const search = searchParams.get("search") || undefined
  const isFavorite = searchParams.has("favorite") ? searchParams.get("favorite") === "true" : undefined
  const visibility = searchParams.get("visibility") as "public" | "private" | undefined

  const items = await getUserMediaItems(effectiveUserId, {
    kind: kind || undefined,
    boardId,
    search,
    isFavorite,
    visibility,
  })

  return NextResponse.json({ ok: true, items })
}

export async function POST(request: Request) {
  const { userId } = await auth()
  const effectiveUserId = userId || "guest_preview"

  try {
    const body = await request.json()
    const { url, kind, prompt, tagline, ratio, style, visibility, boardIds } = body

    if (!url || !prompt) {
      return NextResponse.json({ error: "URL and prompt are required." }, { status: 400 })
    }

    const key = `users/${effectiveUserId}/${kind || "image"}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`
    const r2Result = await fetchAndUploadToR2(url, key)

    const saved = await saveMediaItem({
      clerkId: effectiveUserId,
      key: r2Result.key,
      url: r2Result.url,
      kind: kind || "image",
      prompt,
      tagline,
      ratio: ratio || "16:9",
      style,
      sizeBytes: r2Result.sizeBytes,
      visibility: visibility || "private",
      boardIds: Array.isArray(boardIds) ? boardIds : [],
    })

    if (saved.error) {
      return NextResponse.json({ error: saved.error }, { status: 400 })
    }

    return NextResponse.json({ ok: true, item: saved.media })
  } catch (error) {
    console.error("Error saving media:", error)
    return NextResponse.json({ error: "Failed to save media item." }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const { userId } = await auth()
  const effectiveUserId = userId || "guest_preview"

  try {
    const body = await request.json()
    const { mediaId, prompt, tagline, visibility, isFavorite, boardIds } = body

    if (!mediaId) {
      return NextResponse.json({ error: "mediaId is required." }, { status: 400 })
    }

    const res = await updateMediaItem(effectiveUserId, mediaId, {
      prompt,
      tagline,
      visibility,
      isFavorite,
      boardIds,
    })

    if (!res.ok) {
      return NextResponse.json({ error: res.error || "Update failed." }, { status: 400 })
    }

    return NextResponse.json({ ok: true, item: res.media })
  } catch (error) {
    console.error("Error updating media:", error)
    return NextResponse.json({ error: "Failed to update media item." }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const { userId } = await auth()
  const effectiveUserId = userId || "guest_preview"

  const { searchParams } = new URL(request.url)
  const mediaId = searchParams.get("mediaId")
  const permanent = searchParams.get("permanent") === "true"

  if (!mediaId) {
    return NextResponse.json({ error: "mediaId is required." }, { status: 400 })
  }

  if (permanent) {
    const res = await permanentlyDeleteMediaItem(effectiveUserId, mediaId)
    return NextResponse.json({ ok: res.ok, error: res.error })
  }

  const res = await softDeleteMediaItem(effectiveUserId, mediaId)
  return NextResponse.json({ ok: res.ok, error: res.error })
}
