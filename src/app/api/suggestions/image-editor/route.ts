import { NextRequest, NextResponse } from "next/server"
import { ai } from "@/ai/genkit"
import { guardMutating, requireUser, tooLargeDataUri } from "@/lib/auth-api"

export async function POST(req: NextRequest) {
  const session = await requireUser()
  if (session.error) return session.error
  const blocked = guardMutating(req, `suggest:${session.userId}`, 10)
  if (blocked) return blocked

  try {
    const { sourceImageUri, type } = await req.json()

    if (!sourceImageUri || !type) {
      return NextResponse.json({ success: false, message: "Missing sourceImageUri or type" }, { status: 400 })
    }
    if (tooLargeDataUri(sourceImageUri)) {
      return NextResponse.json({ success: false, message: "Image is too large." }, { status: 413 })
    }

    let prompt: string
    if (type === "name") {
      prompt =
        "Given the following image, suggest a concise and creative business name (2-5 words). Only return the name, no other text."
    } else if (type === "description") {
      prompt =
        "Given the following image, suggest a brief and compelling business description (1-2 sentences). Only return the description, no other text."
    } else {
      return NextResponse.json({ success: false, message: "Invalid suggestion type" }, { status: 400 })
    }

    const mimeMatch = typeof sourceImageUri === "string" ? sourceImageUri.match(/^data:([^;]+);base64,/) : null
    const contentType = mimeMatch?.[1] || "image/jpeg"

    const response = await ai.generate({
      model: "googleai/gemini-2.5-flash",
      prompt: [{ text: prompt }, { media: { url: sourceImageUri, contentType } }],
      config: { temperature: 0.7 },
    })

    const suggestion = response.text.trim()
    return NextResponse.json({ success: true, suggestion })
  } catch (error) {
    console.error("Error generating suggestion:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
