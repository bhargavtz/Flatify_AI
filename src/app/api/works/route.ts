import { NextResponse } from "next/server"
import { isError, publishWork } from "@/lib/social"
import type { WorkKind } from "@/lib/social-types"
import { guardMutating, requireUser } from "@/lib/auth-api"

export async function POST(request: Request) {
  const session = await requireUser()
  if (session.error) return session.error
  const blocked = guardMutating(request, `publish:${session.userId}`, 10)
  if (blocked) return blocked

  const body = (await request.json()) as {
    kind?: WorkKind
    prompt?: string
    tagline?: string
    ratio?: string
    paper?: string
    motion?: string
    length?: string
  }

  const result = await publishWork({
    kind: body.kind === "video" ? "video" : "image",
    prompt: body.prompt ?? "",
    tagline: body.tagline ?? "",
    ratio: body.ratio ?? "16:9",
    paper: body.paper,
    motion: body.motion,
    length: body.length,
  })

  if (isError(result)) {
    const status = result.error.startsWith("Sign in") ? 401 : 400
    return NextResponse.json(result, { status })
  }

  return NextResponse.json({ work: result })
}
