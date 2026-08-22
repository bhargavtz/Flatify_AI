import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { guardMutating } from "@/lib/auth-api"
import { assertCanGenerate, isError } from "@/lib/settings"
import { createGenerationBatch } from "@/lib/generation-queue"
import clientPromise from "@/lib/mongodb"

export async function POST(request: Request) {
  const { userId } = await auth()
  const effectiveUserId = userId || "guest_preview"
  const blocked = guardMutating(request, `generations:${effectiveUserId}`, 30)
  if (blocked) return blocked

  const body = (await request.json()) as {
    kind?: "image" | "video"
    prompt?: string
    aspectRatio?: string
    ratio?: string
    paper?: string
    motion?: string
    length?: string
    requestedModel?: string
    provider?: string
  }

  const prompt = (body.prompt ?? "").trim()
  if (prompt.length < 2) {
    return NextResponse.json({ ok: false, error: "Prompt must be at least 2 characters." }, { status: 400 })
  }

  const kind = body.kind === "video" ? "video" : "image"
  const ratio = body.aspectRatio || body.ratio || "16:9"

  // Check quota
  const allowed = await assertCanGenerate(effectiveUserId, kind, false)
  if (isError(allowed)) {
    return NextResponse.json(allowed, { status: 402 })
  }

  try {
    const result = await createGenerationBatch({
      userId: effectiveUserId,
      kind,
      prompt,
      aspectRatio: ratio,
      paper: body.paper,
      motion: body.motion,
      length: body.length,
      requestedModel: body.requestedModel,
      provider: body.provider,
    })

    return NextResponse.json(
      {
        ok: true,
        batchId: result.batchId,
        status: result.batch.status,
        takesCount: result.takes.length,
        takes: result.takes.map((t) => ({
          _id: t._id,
          takeNumber: t.takeNumber,
          creativeDirection: t.creativeDirection,
          kicker: t.kicker,
          status: t.status,
          statusMessage: t.statusMessage,
          seed: t.seed,
          width: t.width,
          height: t.height,
        })),
      },
      { status: 202 }
    )
  } catch (err: any) {
    console.error("Batch creation failed:", err)
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to initialize generation batch" },
      { status: 500 }
    )
  }
}

export async function GET() {
  const { userId } = await auth()
  const effectiveUserId = userId || "guest_preview"

  try {
    const client = await clientPromise
    const db = client.db()
    const batches = await db
      .collection("generation_batches")
      .find({ userId: effectiveUserId })
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray()

    return NextResponse.json({ ok: true, batches })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message }, { status: 500 })
  }
}
