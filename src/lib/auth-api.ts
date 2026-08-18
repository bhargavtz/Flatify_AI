import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

export const MAX_DATA_URI_CHARS = 1_200_000

export async function requireUser(): Promise<
  { userId: string; error?: undefined } | { userId?: undefined; error: NextResponse }
> {
  const { userId } = await auth()
  if (!userId) {
    return {
      error: NextResponse.json(
        { success: false, message: "Sign in required." },
        { status: 401 }
      ),
    }
  }
  return { userId }
}

export async function requireSignedIn(): Promise<string> {
  const { userId } = await auth()
  if (!userId) throw new Error("Sign in required.")
  if (!rateLimit(`action:${userId}`, 12)) {
    throw new Error("Too many requests. Wait a minute.")
  }
  return userId
}

export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin")
  if (!origin) return true
  const host = request.headers.get("host")
  if (!host) return false
  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}

export function rejectCrossOrigin(request: Request): NextResponse | null {
  if (sameOrigin(request)) return null
  return NextResponse.json({ success: false, message: "Invalid origin." }, { status: 403 })
}

const hits = new Map<string, { n: number; t: number }>()

export function rateLimit(key: string, max = 20, windowMs = 60_000): boolean {
  const now = Date.now()
  const row = hits.get(key)
  if (!row || now - row.t > windowMs) {
    hits.set(key, { n: 1, t: now })
    return true
  }
  if (row.n >= max) return false
  row.n += 1
  return true
}

export function tooLargeDataUri(value: unknown): boolean {
  return typeof value === "string" && value.startsWith("data:") && value.length > MAX_DATA_URI_CHARS
}

export function guardMutating(request: Request, key: string, max = 20): NextResponse | null {
  const origin = rejectCrossOrigin(request)
  if (origin) return origin
  if (!rateLimit(key, max)) {
    return NextResponse.json(
      { success: false, message: "Too many requests. Wait a minute." },
      { status: 429 }
    )
  }
  return null
}
