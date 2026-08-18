import { NextResponse } from "next/server"
import { getProfile, updateMyProfile, upsertMyProfile, viewerId } from "@/lib/social"
import { guardMutating, requireUser } from "@/lib/auth-api"

export async function GET() {
  const author = await upsertMyProfile()
  if (!author) {
    return NextResponse.json({ error: "Sign in to open your profile." }, { status: 401 })
  }
  const clerkId = await viewerId()
  const profile = await getProfile(author.username, clerkId)
  return NextResponse.json({
    profile: profile ?? {
      ...author,
      bio: "",
      coverUrl: null,
      location: "",
      website: "",
      workCount: 0,
      works: [],
    },
  })
}

export async function PATCH(request: Request) {
  const session = await requireUser()
  if (session.error) return session.error
  const blocked = guardMutating(request, `profile:${session.userId}`, 20)
  if (blocked) return blocked

  const body = (await request.json()) as {
    tagline?: string
    displayName?: string
    bio?: string
    location?: string
    website?: string
    avatarUrl?: string | null
    coverUrl?: string | null
  }
  const author = await updateMyProfile(body)
  if (!author) {
    return NextResponse.json({ error: "Could not save. Check image size and website." }, { status: 400 })
  }
  return NextResponse.json({ author })
}
