import { type NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"
import { guardMutating, requireUser, tooLargeDataUri } from "@/lib/auth-api"

function mongoError(error: unknown): NextResponse {
  console.error("Novice generation API error:", error)
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
    const { businessName, businessDescription, primaryColor, secondaryColor, logoDataUri } = await request.json()

    if (!logoDataUri || !businessName || !businessDescription) {
      return NextResponse.json(
        { success: false, message: "Business name, description, and logo data are required." },
        { status: 400 }
      )
    }
    if (tooLargeDataUri(logoDataUri)) {
      return NextResponse.json({ success: false, message: "Logo is too large to store." }, { status: 413 })
    }

    const client = await clientPromise
    const db = client.db()
    await db.collection("novice_generations").insertOne({
      userId: session.userId,
      businessName,
      businessDescription,
      primaryColor,
      secondaryColor,
      logoDataUri,
      createdAt: new Date(),
    })

    return NextResponse.json({ success: true, message: "Novice logo generation saved." })
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
    const result = await db.collection("novice_generations").deleteOne({
      _id: new ObjectId(id),
      userId: session.userId,
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, message: "Novice logo not found or user not authorized." }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "Novice logo deleted successfully." })
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
      .collection("novice_generations")
      .find({ userId: session.userId })
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json({ success: true, data: generations })
  } catch (error) {
    return mongoError(error)
  }
}
