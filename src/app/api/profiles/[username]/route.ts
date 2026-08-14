import { NextResponse } from "next/server"
import { getProfile, viewerId } from "@/lib/social"

export async function GET(
  _request: Request,
  context: { params: Promise<{ username: string }> }
) {
  const { username } = await context.params
  const clerkId = await viewerId()
  const profile = await getProfile(username, clerkId)
  if (!profile) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 })
  }
  return NextResponse.json({ profile })
}
