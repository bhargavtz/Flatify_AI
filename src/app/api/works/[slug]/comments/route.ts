import { NextResponse } from "next/server"
import { addComment, isError, listComments } from "@/lib/social"
import { guardMutating, requireUser } from "@/lib/auth-api"

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params
  const comments = await listComments(slug)
  return NextResponse.json({ comments })
}

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const session = await requireUser()
  if (session.error) return session.error
  const blocked = guardMutating(request, `comment:${session.userId}`, 12)
  if (blocked) return blocked

  const { slug } = await context.params
  const body = (await request.json()) as { body?: string }
  const result = await addComment(slug, body.body ?? "")
  if (isError(result)) {
    const status = result.error.startsWith("Sign in") ? 401 : 400
    return NextResponse.json(result, { status })
  }
  return NextResponse.json({ comment: result })
}
