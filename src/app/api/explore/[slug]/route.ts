import { NextResponse } from "next/server"
import { getWork, listComments, viewerId } from "@/lib/social"

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params
  const clerkId = await viewerId()
  const work = await getWork(slug, clerkId)
  if (!work) {
    return NextResponse.json({ error: "Work not found." }, { status: 404 })
  }
  const comments = await listComments(slug)
  return NextResponse.json({ work, comments })
}
