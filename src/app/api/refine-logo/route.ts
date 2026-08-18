import { NextRequest, NextResponse } from "next/server"
import { ai } from "@/ai/genkit"
import { guardMutating, requireUser, tooLargeDataUri } from "@/lib/auth-api"

export async function POST(req: NextRequest) {
  const session = await requireUser()
  if (session.error) return session.error
  const blocked = guardMutating(req, `refine:${session.userId}`, 8)
  if (blocked) return blocked

  try {
    const { logoDataUri, refinementPrompt } = await req.json()

    if (!logoDataUri || !refinementPrompt) {
      return NextResponse.json(
        { success: false, message: "Missing logoDataUri or refinementPrompt" },
        { status: 400 }
      )
    }
    if (tooLargeDataUri(logoDataUri)) {
      return NextResponse.json({ success: false, message: "Image is too large." }, { status: 413 })
    }

    const response = await ai.generate({
      model: "googleai/gemini-2.0-flash-exp",
      prompt: [
        { media: { url: logoDataUri } },
        {
          text: `Refine the provided logo based on the following instructions: "${String(refinementPrompt).slice(0, 500)}". The output should be a new version of the logo incorporating these changes, maintaining a flat design style.`,
        },
      ],
      config: {
        responseModalities: ["TEXT", "IMAGE"],
      },
    })

    const refinedLogoDataUri = response.media?.url
    if (!refinedLogoDataUri) {
      throw new Error("Logo refinement failed to produce a valid media object.")
    }

    return NextResponse.json({ success: true, refinedLogoDataUri })
  } catch (error) {
    console.error("Error refining logo:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
