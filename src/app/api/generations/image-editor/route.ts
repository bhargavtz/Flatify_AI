import { type NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"
import { guardMutating, requireUser, tooLargeDataUri } from "@/lib/auth-api"

function mongoError(error: unknown): NextResponse {
  console.error("Image editor generation API error:", error)
  if (error instanceof Error && error.name === "MongoNetworkError") {
    return NextResponse.json({ success: false, message: "Database connection error." }, { status: 503 })
  }
  return NextResponse.json({ success: false, message: "An internal server error occurred." }, { status: 500 })
}

export async function POST(request: NextRequest) {
  const session = await requireUser()
  if (session.error) return session.error
  const blocked = guardMutating(request, `gen:${session.userId}`, 12)
  if (blocked) return blocked

  try {
    const { sourceImageUri, sourceImageOriginalName, businessName, businessDescription, logoDataUri } =
      await request.json()

    if (!sourceImageUri || !businessName || !businessDescription || !logoDataUri) {
      return NextResponse.json(
        { success: false, message: "Source image, business details, and logo data are required." },
        { status: 400 }
      )
    }
    if (tooLargeDataUri(logoDataUri) || tooLargeDataUri(sourceImageUri)) {
      return NextResponse.json({ success: false, message: "Image is too large to store." }, { status: 413 })
    }

    const client = await clientPromise
    const db = client.db()
    await db.collection("image_editor_generations").insertOne({
      userId: session.userId,
      sourceImageUri,
      sourceImageOriginalName,
      businessName,
      businessDescription,
      logoDataUri,
      createdAt: new Date(),
    })

    return NextResponse.json({ success: true, message: "Image Editor logo generation saved." })
  } catch (error) {
    return mongoError(error)
  }
}

export async function DELETE(request: NextRequest) {
  const session = await requireUser()
  if (session.error) return session.error
  const blocked = guardMutating(request, `del:${session.userId}`, 30)
  if (blocked) return blocked

  try {
    const id = new URL(request.url).searchParams.get("id")
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: "A valid ID is required." }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db()
    const result = await db.collection("image_editor_generations").deleteOne({
      _id: new ObjectId(id),
      userId: session.userId,
    })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: "Image Editor logo not found or user not authorized." },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, message: "Image Editor logo deleted successfully." })
  } catch (error) {
    return mongoError(error)
  }
}

export async function GET(request: NextRequest) {
  const session = await requireUser()
  if (session.error) return session.error
  void request

  try {
    const client = await clientPromise
    const db = client.db()
    const generations = await db
      .collection("image_editor_generations")
      .find({ userId: session.userId })
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json({ success: true, data: generations })
  } catch (error) {
    return mongoError(error)
  }
}
