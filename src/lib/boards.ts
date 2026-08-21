import clientPromise from "@/lib/mongodb"
import { ObjectId, type Db } from "mongodb"
import { slugify } from "@/lib/social-types"

export interface Board {
  _id: string
  clerkId: string
  slug: string
  title: string
  description?: string
  visibility: "public" | "private"
  coverUrl?: string | null
  itemCount: number
  createdAt: string
  updatedAt: string
}

async function getDb(): Promise<Db | null> {
  try {
    const client = await clientPromise
    return client.db()
  } catch (error) {
    console.error("MongoDB handle error in boards:", error)
    return null
  }
}

/**
 * Creates a new Pinterest-style board (Public or Private)
 */
export async function createBoard(input: {
  clerkId: string
  title: string
  description?: string
  visibility?: "public" | "private"
  coverUrl?: string | null
}): Promise<{ board?: Board; error?: string }> {
  const db = await getDb()
  if (!db) return { error: "Database offline." }

  const cleanTitle = input.title.trim()
  if (!cleanTitle) return { error: "Board title is required." }

  const baseSlug = slugify(cleanTitle)
  const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 7)}`
  const now = new Date()

  const doc = {
    clerkId: input.clerkId,
    slug,
    title: cleanTitle,
    description: input.description?.trim() || "",
    visibility: input.visibility || "public",
    coverUrl: input.coverUrl || null,
    createdAt: now,
    updatedAt: now,
  }

  try {
    const res = await db.collection("studio_boards").insertOne(doc)
    return {
      board: {
        ...doc,
        _id: res.insertedId.toString(),
        itemCount: 0,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
    }
  } catch (error) {
    console.error("Error creating board:", error)
    return { error: "Could not create board." }
  }
}

/**
 * Gets all boards belonging to a user with live item counts
 */
export async function getUserBoards(clerkId: string): Promise<Board[]> {
  const db = await getDb()
  if (!db) return []

  try {
    const boards = await db
      .collection("studio_boards")
      .find({ clerkId })
      .sort({ createdAt: -1 })
      .toArray()

    const boardIds = boards.map((b) => b._id.toString())

    // Aggregate item counts per board from studio_media
    const counts = await db
      .collection("studio_media")
      .aggregate([
        { $match: { clerkId, deletedAt: null, boardIds: { $in: boardIds } } },
        { $unwind: "$boardIds" },
        { $match: { boardIds: { $in: boardIds } } },
        { $group: { _id: "$boardIds", count: { $sum: 1 } } },
      ])
      .toArray()

    const countMap = new Map<string, number>()
    counts.forEach((c) => countMap.set(c._id.toString(), c.count))

    return boards.map((b) => ({
      _id: b._id.toString(),
      clerkId: b.clerkId,
      slug: b.slug,
      title: b.title,
      description: b.description || "",
      visibility: b.visibility || "public",
      coverUrl: b.coverUrl || null,
      itemCount: countMap.get(b._id.toString()) || 0,
      createdAt: new Date(b.createdAt).toISOString(),
      updatedAt: new Date(b.updatedAt).toISOString(),
    }))
  } catch (error) {
    console.error("Error getting user boards:", error)
    return []
  }
}

/**
 * Gets a public board by its slug
 */
export async function getPublicBoardBySlug(slug: string): Promise<Board | null> {
  const db = await getDb()
  if (!db) return null

  try {
    const b = await db.collection("studio_boards").findOne({ slug, visibility: "public" })
    if (!b) return null

    const itemCount = await db
      .collection("studio_media")
      .countDocuments({ boardIds: b._id.toString(), deletedAt: null })

    return {
      _id: b._id.toString(),
      clerkId: b.clerkId,
      slug: b.slug,
      title: b.title,
      description: b.description || "",
      visibility: "public",
      coverUrl: b.coverUrl || null,
      itemCount,
      createdAt: new Date(b.createdAt).toISOString(),
      updatedAt: new Date(b.updatedAt).toISOString(),
    }
  } catch (error) {
    console.error("Error getting public board:", error)
    return null
  }
}

/**
 * Updates a board (title, description, visibility, cover)
 */
export async function updateBoard(
  clerkId: string,
  boardId: string,
  updates: {
    title?: string
    description?: string
    visibility?: "public" | "private"
    coverUrl?: string | null
  }
): Promise<{ ok: boolean; error?: string }> {
  const db = await getDb()
  if (!db) return { ok: false, error: "Database offline." }

  try {
    const res = await db.collection("studio_boards").updateOne(
      { _id: new ObjectId(boardId), clerkId },
      {
        $set: {
          ...updates,
          updatedAt: new Date(),
        },
      }
    )
    return { ok: res.modifiedCount > 0 || res.matchedCount > 0 }
  } catch (error) {
    console.error("Error updating board:", error)
    return { ok: false, error: "Could not update board." }
  }
}

/**
 * Deletes a board and unlinks it from associated media
 */
export async function deleteBoard(clerkId: string, boardId: string): Promise<{ ok: boolean }> {
  const db = await getDb()
  if (!db) return { ok: false }

  try {
    await db.collection("studio_boards").deleteOne({ _id: new ObjectId(boardId), clerkId })
    await db
      .collection("studio_media")
      .updateMany({ clerkId, boardIds: boardId }, { $pull: { boardIds: boardId } as any })
    return { ok: true }
  } catch (error) {
    console.error("Error deleting board:", error)
    return { ok: false }
  }
}

/**
 * Adds a media item to a board
 */
export async function addMediaToBoard(
  clerkId: string,
  mediaId: string,
  boardId: string
): Promise<{ ok: boolean }> {
  const db = await getDb()
  if (!db) return { ok: false }

  try {
    await db
      .collection("studio_media")
      .updateOne({ _id: new ObjectId(mediaId), clerkId }, { $addToSet: { boardIds: boardId } as any })
    return { ok: true }
  } catch (error) {
    console.error("Error adding media to board:", error)
    return { ok: false }
  }
}

/**
 * Removes a media item from a board
 */
export async function removeMediaFromBoard(
  clerkId: string,
  mediaId: string,
  boardId: string
): Promise<{ ok: boolean }> {
  const db = await getDb()
  if (!db) return { ok: false }

  try {
    await db
      .collection("studio_media")
      .updateOne({ _id: new ObjectId(mediaId), clerkId }, { $pull: { boardIds: boardId } as any })
    return { ok: true }
  } catch (error) {
    console.error("Error removing media from board:", error)
    return { ok: false }
  }
}
