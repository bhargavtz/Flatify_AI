import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { guardMutating } from "@/lib/auth-api"
import { assertCanGenerate, isError } from "@/lib/settings"
import type { WorkKind } from "@/lib/social-types"
import { createGenerationBatch } from "@/lib/generation-queue"

export async function POST(request: Request) {
  const { userId } = await auth()
  const effectiveUserId = userId || "guest_preview"
  const blocked = guardMutating(request, `studio-gen:${effectiveUserId}`, 30)
  if (blocked) return blocked

  const body = (await request.json()) as {
    kind?: WorkKind | "cut"
    prompt?: string
    ratio?: string
    paper?: string
    motion?: string
    length?: string
  }
  const kind = body.kind === "video" || body.kind === "cut" ? body.kind : "image"
  const prompt = (body.prompt ?? "").trim()
  if (prompt.length < 2) {
    return NextResponse.json({ error: "Write a prompt first." }, { status: 400 })
  }

  const allowed = await assertCanGenerate(effectiveUserId, kind, false)
  if (isError(allowed)) {
    return NextResponse.json(allowed, { status: 402 })
  }

  try {
    const result = await createGenerationBatch({
      userId: effectiveUserId,
      kind: kind === "video" ? "video" : "image",
      prompt,
      aspectRatio: body.ratio || "16:9",
      paper: body.paper,
      motion: body.motion,
      length: body.length,
    })

    return NextResponse.json({
      ok: true,
      batchId: result.batchId,
      status: result.batch.status,
      takes: result.takes,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Generation initialization failed" }, { status: 500 })
  }
}
