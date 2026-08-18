import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { guardMutating, requireUser } from "@/lib/auth-api"

const MAX_HISTORY_ITEMS = 15

interface HistoryDoc {
  clerkId: string
  prompts: string[]
  updatedAt: Date
}

function mongoError(error: unknown): NextResponse {
  console.error("Prompt history API error:", error)
  if (error instanceof Error && error.name === "MongoNetworkError") {
    return NextResponse.json({ success: false, message: "Database connection error." }, { status: 503 })
  }
  return NextResponse.json({ success: false, message: "An internal server error occurred." }, { status: 500 })
}

async function historyCol() {
  const client = await clientPromise
  return client.db().collection<HistoryDoc>("prompt_histories")
}

export async function GET() {
  const session = await requireUser()
  if (session.error) return session.error

  try {
    const col = await historyCol()
    const doc = await col.findOne({ clerkId: session.userId })
    return NextResponse.json({ success: true, promptHistory: doc?.prompts ?? [] })
  } catch (error) {
    return mongoError(error)
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

    const col = await historyCol()
    const existing = await col.findOne({ clerkId: session.userId })
    const current = existing?.prompts ?? []
    const next = [prompt.trim(), ...current.filter((row) => row !== prompt.trim())].slice(0, MAX_HISTORY_ITEMS)
    await col.updateOne(
      { clerkId: session.userId },
      { $set: { clerkId: session.userId, prompts: next, updatedAt: new Date() } },
      { upsert: true }
    )

    return NextResponse.json({ success: true, message: "Prompt history updated.", promptHistory: next })
  } catch (error) {
    return mongoError(error)
  }
}

export async function DELETE(request: NextRequest) {
  const session = await requireUser()
  if (session.error) return session.error
  const blocked = guardMutating(request, `hist-del:${session.userId}`, 40)
  if (blocked) return blocked

  try {
    const params = new URL(request.url).searchParams
    const promptToDelete = params.get("prompt")
    const indexParam = params.get("id")

    const col = await historyCol()
    const existing = await col.findOne({ clerkId: session.userId })
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

    await col.updateOne(
      { clerkId: session.userId },
      { $set: { clerkId: session.userId, prompts: next, updatedAt: new Date() } },
      { upsert: true }
    )

    return NextResponse.json({ success: true, message: "Prompt deleted successfully.", promptHistory: next })
  } catch (error) {
    return mongoError(error)
  }
}
