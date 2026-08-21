import { createClient } from "@supabase/supabase-js"

const ALLOWED_JPEG = /^data:image\/jpeg;base64,/
const ALLOWED_PNG = /^data:image\/png;base64,/
const MAX_CHARS = 400_000

export function isSafeMediaUrl(value: string): boolean {
  if (!value) return true
  if (ALLOWED_JPEG.test(value) || ALLOWED_PNG.test(value)) {
    return value.length <= MAX_CHARS
  }
  try {
    const url = new URL(value)
    if (url.protocol !== "https:") return false
    const host = url.hostname
    return (
      host.endsWith(".clerk.com") ||
      host.endsWith(".clerk.accounts.dev") ||
      host.endsWith(".supabase.co") ||
      host.endsWith(".r2.dev") ||
      host.endsWith(".pollinations.ai") ||
      host === "img.clerk.com" ||
      host === "image.pollinations.ai"
    )
  } catch {
    return false
  }
}

function dataUrlToBytes(dataUrl: string): { bytes: Buffer; contentType: string } | null {
  const match = dataUrl.match(/^data:(image\/(?:jpeg|png));base64,(.+)$/)
  if (!match?.[1] || !match[2]) return null
  return {
    contentType: match[1],
    bytes: Buffer.from(match[2], "base64"),
  }
}

export async function storeUserMedia(
  clerkId: string,
  kind: "avatar" | "cover",
  dataUrl: string
): Promise<string | { error: string }> {
  if (!isSafeMediaUrl(dataUrl)) {
    return { error: "That image is not allowed. Use a JPEG/PNG under 300KB." }
  }
  if (!dataUrl.startsWith("data:")) return dataUrl

  const parsed = dataUrlToBytes(dataUrl)
  if (!parsed) return { error: "Could not read image." }
  if (parsed.bytes.length > 350_000) return { error: "Image is too large." }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const bucket = process.env.SUPABASE_MEDIA_BUCKET || "user-media"

  if (!url || !key || url.includes("your-project")) {
    return dataUrl
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } })
  const ext = parsed.contentType === "image/png" ? "png" : "jpg"
  const path = `${clerkId}/${kind}.${ext}`
  const { error } = await supabase.storage.from(bucket).upload(path, parsed.bytes, {
    contentType: parsed.contentType,
    upsert: true,
  })
  if (error) {
    console.error("Object storage upload failed:", error.message)
    return dataUrl
  }
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}
