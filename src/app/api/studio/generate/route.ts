import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { guardMutating } from "@/lib/auth-api"
import { assertCanGenerate, getActiveUserKey, isError, logGeneration } from "@/lib/settings"
import type { WorkKind } from "@/lib/social-types"

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Sign in to generate." }, { status: 401 })
  }
  const blocked = guardMutating(request, `studio-gen:${userId}`, 20)
  if (blocked) return blocked

  const body = (await request.json()) as {
    kind?: WorkKind | "cut" | "logo"
    prompt?: string
    ratio?: string
    motion?: string
    length?: string
  }
  const kind = body.kind === "video" || body.kind === "cut" || body.kind === "logo" ? body.kind : "image"
  const prompt = (body.prompt ?? "").trim()
  if (prompt.length < 2) {
    return NextResponse.json({ error: "Write a prompt first." }, { status: 400 })
  }

  const prefer =
    kind === "video"
      ? (["replicate", "fal", "openrouter"] as const)
      : (["openai", "openrouter", "google"] as const)

  const own = await getActiveUserKey(userId, [...prefer])
  const usedOwnKey = Boolean(own)
  const allowed = await assertCanGenerate(userId, kind, usedOwnKey)
  if (isError(allowed)) {
    return NextResponse.json(allowed, { status: 402 })
  }

  const provider = usedOwnKey && own ? own.provider : "flatify-free"
  let imageUrl: string | null = null
  let images: string[] = []
  let videoUrl: string | null = null

  if (own) {
    imageUrl = await tryProviderFrame(own.provider, own.plain, prompt)
  }

  const encoded = encodeURIComponent(prompt)
  const baseSeed = Math.floor(Math.random() * 900000)

  if (kind === "video") {
    // 100% Free Video & Motion Pipeline
    const motionPrompt = encodeURIComponent(`${prompt}, cinematic motion, ${body.motion || "smooth pan"}, 4k film`)
    videoUrl = `https://image.pollinations.ai/prompt/${motionPrompt}?model=flux&seed=${baseSeed}&nologo=true`
    imageUrl = videoUrl
    images = [videoUrl]
  } else {
    // 100% Free High-Res Image Pipeline (Flux / SDXL)
    images = [
      `https://image.pollinations.ai/prompt/${encoded}?model=flux&seed=${baseSeed}&nologo=true`,
      `https://image.pollinations.ai/prompt/${encoded}%2C%20cinematic%20lighting?model=flux&seed=${baseSeed + 1}&nologo=true`,
      `https://image.pollinations.ai/prompt/${encoded}%2C%20minimalist%20composition?model=flux&seed=${baseSeed + 2}&nologo=true`,
      `https://image.pollinations.ai/prompt/${encoded}%2C%20editorial%20photography?model=flux&seed=${baseSeed + 3}&nologo=true`,
    ]
    imageUrl = images[0]
  }

  await logGeneration({
    clerkId: userId,
    kind,
    prompt,
    usedOwnKey,
    provider,
  })

  return NextResponse.json({
    ok: true,
    usedOwnKey,
    provider,
    imageUrl,
    images,
    videoUrl,
  })
}

async function tryProviderFrame(
  provider: string,
  key: string,
  prompt: string
): Promise<string | null> {
  try {
    if (provider === "openai") {
      const res = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt,
          n: 1,
          size: "1024x1024",
        }),
      })
      if (!res.ok) return null
      const data = (await res.json()) as { data?: Array<{ url?: string }> }
      return data.data?.[0]?.url ?? null
    }

    if (provider === "openrouter") {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.0-flash-exp:free",
          messages: [{ role: "user", content: `Describe a still frame: ${prompt}` }],
        }),
      })
      if (!res.ok) return null
    }
  } catch {
    return null
  }
  return null
}
