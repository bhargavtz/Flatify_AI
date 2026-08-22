import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { cancelBatch } from "@/lib/generation-queue"

export async function POST(
  request: Request,
  context: { params: Promise<{ batchId: string }> }
) {
  let batchId = ""
  try {
    const params = await context.params
    batchId = params?.batchId || ""
  } catch {
    /* fallback */
  }

  if (!batchId) {
    const urlParts = new URL(request.url).pathname.split("/")
    // /api/generations/[batchId]/cancel -> index length - 2
    batchId = urlParts[urlParts.length - 2] || ""
  }

  await auth()

  if (!batchId) {
    return NextResponse.json({ ok: false, error: "batchId is required" }, { status: 400 })
  }

  const cancelled = await cancelBatch(batchId)
  if (!cancelled) {
    return NextResponse.json({ ok: false, error: "Batch not found or already finished" }, { status: 404 })
  }

  return NextResponse.json({ ok: true, message: "Generation batch cancelled" })
}
