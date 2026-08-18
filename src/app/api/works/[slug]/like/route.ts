import { NextResponse } from "next/server"
import { isError, toggleLike } from "@/lib/social"
import { guardMutating, requireUser } from "@/lib/auth-api"

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const session = await requireUser()
  if (session.error) return session.error
  const blocked = guardMutating(request, `like:${session.userId}`, 40)
  if (blocked) return blocked

  const { slug } = await context.params
  const result = await toggleLike(slug)
  if (isError(result)) {
    const status = result.error.startsWith("Sign in") ? 401 : 400
    return NextResponse.json(result, { status })
  }
  return NextResponse.json(result)
}
