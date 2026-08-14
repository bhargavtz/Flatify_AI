import { NextResponse } from "next/server"
import { isError, removeUserKey, saveUserKey } from "@/lib/settings"
import type { KeyProvider } from "@/lib/social-types"
import { guardMutating, requireUser } from "@/lib/auth-api"

export async function POST(request: Request) {
  const session = await requireUser()
  if (session.error) return session.error
  const blocked = guardMutating(request, `keys:${session.userId}`, 10)
  if (blocked) return blocked

  const body = (await request.json()) as { provider?: KeyProvider; key?: string }
  if (!body.provider || !body.key) {
    return NextResponse.json({ error: "Provider and key are required." }, { status: 400 })
  }
  const result = await saveUserKey(body.provider, body.key)
  if (isError(result)) {
    const status = result.error.startsWith("Sign in") ? 401 : 400
    return NextResponse.json(result, { status })
  }
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request) {
  const session = await requireUser()
  if (session.error) return session.error
  const blocked = guardMutating(request, `keys-del:${session.userId}`, 10)
  if (blocked) return blocked

  const body = (await request.json()) as { provider?: KeyProvider }
  if (!body.provider) {
    return NextResponse.json({ error: "Provider is required." }, { status: 400 })
  }
  const result = await removeUserKey(body.provider)
  if (isError(result)) {
    const status = result.error.startsWith("Sign in") ? 401 : 400
    return NextResponse.json(result, { status })
  }
  return NextResponse.json({ ok: true })
}
