import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import {
  createBoard,
  getUserBoards,
  updateBoard,
  deleteBoard,
  addMediaToBoard,
  removeMediaFromBoard,
} from "@/lib/boards"

export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const boards = await getUserBoards(userId)
  return NextResponse.json({ ok: true, boards })
}

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { title, description, visibility, coverUrl } = body

    if (!title || typeof title !== "string") {
      return NextResponse.json({ error: "Title is required." }, { status: 400 })
    }

    const res = await createBoard({
      clerkId: userId,
      title,
      description,
      visibility,
      coverUrl,
    })

    if (res.error) {
      return NextResponse.json({ error: res.error }, { status: 400 })
    }

    return NextResponse.json({ ok: true, board: res.board })
  } catch (error) {
    console.error("Error creating board:", error)
    return NextResponse.json({ error: "Failed to create board." }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { boardId, action, mediaId, title, description, visibility, coverUrl } = body

    if (!boardId) {
      return NextResponse.json({ error: "boardId is required." }, { status: 400 })
    }

    if (action === "addMedia" && mediaId) {
      const res = await addMediaToBoard(userId, mediaId, boardId)
      return NextResponse.json({ ok: res.ok })
    }

    if (action === "removeMedia" && mediaId) {
      const res = await removeMediaFromBoard(userId, mediaId, boardId)
      return NextResponse.json({ ok: res.ok })
    }

    const res = await updateBoard(userId, boardId, {
      title,
      description,
      visibility,
      coverUrl,
    })

    return NextResponse.json({ ok: res.ok, error: res.error })
  } catch (error) {
    console.error("Error updating board:", error)
    return NextResponse.json({ error: "Failed to update board." }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const boardId = searchParams.get("boardId")

  if (!boardId) {
    return NextResponse.json({ error: "boardId is required." }, { status: 400 })
  }

  const res = await deleteBoard(userId, boardId)
  return NextResponse.json({ ok: res.ok })
}
