import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getBatchDetails } from "@/lib/generation-queue"

export async function GET(
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
    batchId = urlParts[urlParts.length - 1] || ""
  }

  const { userId } = await auth()
  const effectiveUserId = userId || "guest_preview"

  if (!batchId) {
    return NextResponse.json({ ok: false, error: "batchId is required" }, { status: 400 })
  }

  const details = await getBatchDetails(batchId, effectiveUserId)
  if (!details) {
    return NextResponse.json({ ok: false, error: "Generation batch not found or unauthorized" }, { status: 404 })
  }

  return NextResponse.json(details)
}
