import { type NextRequest, NextResponse } from "next/server"
import { db, isDbConfigured } from "@/lib/db"
import { guardMutating, requireUser } from "@/lib/auth-api"

const MAX_HISTORY_ITEMS = 15

function dbError(error: unknown): NextResponse {
  console.error("Prompt history API error:", error)
  return NextResponse.json({ success: false, message: "Database service unavailable." }, { status: 503 })
}

export async function GET() {
  const session = await requireUser()
  if (session.error) return session.error

  if (!isDbConfigured()) {
    return NextResponse.json({ success: true, promptHistory: [] })
  }

  try {
    const doc = await db.userPromptHistory.findUnique({
      where: { clerkId: session.userId },
    })
    return NextResponse.json({ success: true, promptHistory: doc?.prompts ?? [] })
  } catch (error) {
    return dbError(error)
  }
}

export async function POST(request: NextRequest) {
  const session = await requireUser()
  if (session.error) return session.error
  const blocked = guardMutating(request, `hist:${session.userId}`, 40)
  if (blocked) return blocked

  try {
    const { prompt } = await request.json()
    if (typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json({ success: false, message: "A prompt is required." }, { status: 400 })
    }

    if (!isDbConfigured()) {
      return NextResponse.json({ success: true, message: "Database offline (in-memory mode).", promptHistory: [prompt.trim()] })
    }

    const existing = await db.userPromptHistory.findUnique({
      where: { clerkId: session.userId },
    })
    const current = existing?.prompts ?? []
    const next = [prompt.trim(), ...current.filter((row) => row !== prompt.trim())].slice(0, MAX_HISTORY_ITEMS)

    await db.userPromptHistory.upsert({
      where: { clerkId: session.userId },
      update: { prompts: next },
      create: { clerkId: session.userId, prompts: next },
    })

    return NextResponse.json({ success: true, message: "Prompt history updated.", promptHistory: next })
  } catch (error) {
    return dbError(error)
  }
}

export async function DELETE(request: NextRequest) {
  const session = await requireUser()
  if (session.error) return session.error
  const blocked = guardMutating(request, `hist-del:${session.userId}`, 40)
  if (blocked) return blocked

  if (!isDbConfigured()) {
    return NextResponse.json({ success: true, message: "Prompt deleted successfully.", promptHistory: [] })
  }

  try {
    const params = new URL(request.url).searchParams
    const promptToDelete = params.get("prompt")
    const indexParam = params.get("id")

    const existing = await db.userPromptHistory.findUnique({
      where: { clerkId: session.userId },
    })
    const current = existing?.prompts ?? []

    let next: string[]
    if (!promptToDelete && (indexParam === null || indexParam === "")) {
      next = []
    } else if (promptToDelete) {
      next = current.filter((row) => row !== promptToDelete)
      if (next.length === current.length) {
        return NextResponse.json({ success: false, message: "Prompt not found in history." }, { status: 404 })
      }
    } else {
      const index = Number(indexParam)
      if (!Number.isInteger(index) || index < 0 || index >= current.length) {
        return NextResponse.json({ success: false, message: "Prompt not found in history." }, { status: 404 })
      }
      next = current.filter((_, i) => i !== index)
    }

    await db.userPromptHistory.upsert({
      where: { clerkId: session.userId },
      update: { prompts: next },
      create: { clerkId: session.userId, prompts: next },
    })

    return NextResponse.json({ success: true, message: "Prompt deleted successfully.", promptHistory: next })
  } catch (error) {
    return dbError(error)
  }
}
