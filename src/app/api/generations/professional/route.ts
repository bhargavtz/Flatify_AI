import { type NextRequest, NextResponse } from "next/server"
import { db, isDbConfigured } from "@/lib/db"
import { guardMutating, requireUser, tooLargeDataUri } from "@/lib/auth-api"

function dbError(error: unknown): NextResponse {
  console.error("Professional generation API error:", error)
  return NextResponse.json({ success: false, message: "Database service unavailable." }, { status: 503 })
}

export async function POST(request: NextRequest) {
  const session = await requireUser()
  if (session.error) return session.error
  const blocked = guardMutating(request, `gen:${session.userId}`, 12)
  if (blocked) return blocked

  try {
    const { originalPrompt, refinedPrompt, usedPrompt, logoDataUri } = await request.json()

    if (!usedPrompt || !logoDataUri) {
      return NextResponse.json(
        { success: false, message: "Used prompt and logo data are required." },
        { status: 400 }
      )
    }
    if (tooLargeDataUri(logoDataUri)) {
      return NextResponse.json({ success: false, message: "Logo is too large to store." }, { status: 413 })
    }

    if (!isDbConfigured()) {
      return NextResponse.json({ success: true, message: "Professional logo generation received (offline mode)." })
    }

    await db.professionalGeneration.create({
      data: {
        userId: session.userId,
        originalPrompt,
        refinedPrompt,
        usedPrompt,
        logoDataUri,
      },
    })

    return NextResponse.json({ success: true, message: "Professional logo generation saved." })
  } catch (error) {
    return dbError(error)
  }
}

export async function DELETE(request: NextRequest) {
  const session = await requireUser()
  if (session.error) return session.error
  const blocked = guardMutating(request, `del:${session.userId}`, 30)
  if (blocked) return blocked

  if (!isDbConfigured()) {
    return NextResponse.json({ success: true, message: "Professional logo deleted successfully." })
  }

  try {
    const id = new URL(request.url).searchParams.get("id")
    if (!id) {
      return NextResponse.json({ success: false, message: "A valid ID is required." }, { status: 400 })
    }

    const result = await db.professionalGeneration.deleteMany({
      where: {
        id,
        userId: session.userId,
      },
    })

    if (result.count === 0) {
      return NextResponse.json(
        { success: false, message: "Professional logo not found or user not authorized." },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, message: "Professional logo deleted successfully." })
  } catch (error) {
    return dbError(error)
  }
}

export async function GET(request: NextRequest) {
  const session = await requireUser()
  if (session.error) return session.error
  void request

  if (!isDbConfigured()) {
    return NextResponse.json({ success: true, data: [] })
  }

  try {
    const generations = await db.professionalGeneration.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
    })

    // Map `id` to `_id` for backward compatibility
    const mapped = generations.map((g) => ({
      ...g,
      _id: g.id,
    }))

    return NextResponse.json({ success: true, data: mapped })
  } catch (error) {
    return dbError(error)
  }
}
