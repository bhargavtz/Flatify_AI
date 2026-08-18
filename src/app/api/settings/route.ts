import { NextResponse } from "next/server"
import { isError, getSettingsBundle, saveAccountFlags } from "@/lib/settings"
import { updateMyProfile } from "@/lib/social"
import { guardMutating, requireUser } from "@/lib/auth-api"

export async function GET() {
  const result = await getSettingsBundle()
  if (isError(result)) {
    return NextResponse.json(result, { status: 401 })
  }
  return NextResponse.json({ settings: result })
}

export async function PATCH(request: Request) {
  const session = await requireUser()
  if (session.error) return session.error
  const blocked = guardMutating(request, `settings:${session.userId}`, 20)
  if (blocked) return blocked

  const body = (await request.json()) as {
    displayName?: string
    tagline?: string
    bio?: string
    location?: string
    website?: string
    avatarUrl?: string | null
    coverUrl?: string | null
    useOwnKeys?: boolean
  }

  const profile = await updateMyProfile({
    displayName: body.displayName,
    tagline: body.tagline,
    bio: body.bio,
    location: body.location,
    website: body.website,
    avatarUrl: body.avatarUrl,
    coverUrl: body.coverUrl,
  })
  if (!profile && (body.displayName || body.tagline || body.bio !== undefined || body.avatarUrl || body.coverUrl)) {
    return NextResponse.json({ error: "Could not save public profile. Check image size and website." }, { status: 400 })
  }

  if (typeof body.useOwnKeys === "boolean") {
    const flags = await saveAccountFlags({ useOwnKeys: body.useOwnKeys })
    if (isError(flags)) {
      return NextResponse.json(flags, { status: 400 })
    }
  }

  const settings = await getSettingsBundle()
  if (isError(settings)) {
    return NextResponse.json(settings, { status: 401 })
  }
  return NextResponse.json({ settings })
}
