import clientPromise from "@/lib/mongodb"
import { ObjectId, type Db } from "mongodb"
import { deleteObjectFromR2 } from "@/lib/r2"

export const USER_STORAGE_LIMIT_BYTES = 500 * 1024 * 1024 // 500 MB in bytes (524,288,000)
export const TRASH_RETENTION_DAYS = 30

export interface MediaItem {
  _id: string
  clerkId: string
  key: string
  url: string
  kind: "image" | "video"
  prompt: string
  tagline?: string
  ratio: string
  style?: {
    paper?: string
    motion?: string
    length?: string
  }
  sizeBytes: number
  boardIds: string[]
  visibility: "public" | "private"
  isFavorite: boolean
  deletedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface UserStorageQuota {
  bytesUsed: number
  bytesTotal: number
  bytesAvailable: number
  percentUsed: number
  itemsCount: number
  trashBytes: number
  trashCount: number
  isFull: boolean
}

async function getDb(): Promise<Db | null> {
  try {
    const client = await clientPromise
    return client.db()
  } catch (error) {
    console.error("MongoDB handle error in user-storage:", error)
    return null
  }
}

/**
 * Gets real-time 500 MB storage quota metrics for a user
 */
export async function getUserStorageQuota(clerkId: string): Promise<UserStorageQuota> {
  const db = await getDb()
  const bytesTotal = USER_STORAGE_LIMIT_BYTES

  if (!db) {
    return {
      bytesUsed: 0,
      bytesTotal,
      bytesAvailable: bytesTotal,
      percentUsed: 0,
      itemsCount: 0,
      trashBytes: 0,
      trashCount: 0,
      isFull: false,
    }
  }

  try {
    const activePipeline = [
      { $match: { clerkId, deletedAt: null } },
      { $group: { _id: null, totalBytes: { $sum: "$sizeBytes" }, count: { $sum: 1 } } },
    ]
    const trashPipeline = [
      { $match: { clerkId, deletedAt: { $ne: null } } },
      { $group: { _id: null, totalBytes: { $sum: "$sizeBytes" }, count: { $sum: 1 } } },
    ]

    const [activeRes, trashRes] = await Promise.all([
      db.collection("studio_media").aggregate(activePipeline).toArray(),
      db.collection("studio_media").aggregate(trashPipeline).toArray(),
    ])

    const bytesUsed = activeRes[0]?.totalBytes || 0
    const itemsCount = activeRes[0]?.count || 0
    const trashBytes = trashRes[0]?.totalBytes || 0
    const trashCount = trashRes[0]?.count || 0

    const bytesAvailable = Math.max(0, bytesTotal - bytesUsed)
    const percentUsed = Math.min(100, Math.round((bytesUsed / bytesTotal) * 1000) / 10)

    return {
      bytesUsed,
      bytesTotal,
      bytesAvailable,
      percentUsed,
      itemsCount,
      trashBytes,
      trashCount,
      isFull: bytesUsed >= bytesTotal,
    }
  } catch (error) {
    console.error("Error calculating user storage quota:", error)
    return {
      bytesUsed: 0,
      bytesTotal,
      bytesAvailable: bytesTotal,
      percentUsed: 0,
      itemsCount: 0,
      trashBytes: 0,
      trashCount: 0,
      isFull: false,
    }
  }
}

/**
 * Saves a new generated still/clip into user's media library with quota enforcement
 */
export async function saveMediaItem(input: {
  clerkId: string
  key: string
  url: string
  kind: "image" | "video"
  prompt: string
  tagline?: string
  ratio?: string
  style?: { paper?: string; motion?: string; length?: string }
  sizeBytes: number
  visibility?: "public" | "private"
  boardIds?: string[]
}): Promise<{ media?: MediaItem; error?: string }> {
  const db = await getDb()
  if (!db) return { error: "Database unavailable." }

  const quota = await getUserStorageQuota(input.clerkId)
  if (quota.bytesUsed + input.sizeBytes > USER_STORAGE_LIMIT_BYTES) {
    return {
      error: "Storage limit reached (500 MB). Please delete some items from your library or empty your trash.",
    }
  }

  const now = new Date()
  const doc = {
    clerkId: input.clerkId,
    key: input.key,
    url: input.url,
    kind: input.kind,
    prompt: input.prompt,
    tagline: input.tagline ?? "",
    ratio: input.ratio ?? "16:9",
    style: input.style ?? {},
    sizeBytes: input.sizeBytes,
    boardIds: input.boardIds ?? [],
    visibility: input.visibility ?? "private",
    isFavorite: false,
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
  }

  try {
    const res = await db.collection("studio_media").insertOne(doc)
    return {
      media: {
        ...doc,
        _id: res.insertedId.toString(),
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
    }
  } catch (err) {
    console.error("Error saving media item:", err)
    return { error: "Failed to save media item." }
  }
}

/**
 * Fetches user media items with filtering and search
 */
export async function getUserMediaItems(
  clerkId: string,
  options?: {
    kind?: "image" | "video"
    boardId?: string
    isFavorite?: boolean
    visibility?: "public" | "private"
    search?: string
    limit?: number
  }
): Promise<MediaItem[]> {
  const db = await getDb()
  if (!db) return []

  try {
    const query: Record<string, unknown> = {
      clerkId,
      deletedAt: null,
    }

    if (options?.kind) query.kind = options.kind
    if (options?.boardId) query.boardIds = options.boardId
    if (typeof options?.isFavorite === "boolean") query.isFavorite = options.isFavorite
    if (options?.visibility) query.visibility = options.visibility
    if (options?.search) {
      query.$or = [
        { prompt: { $regex: options.search, $options: "i" } },
        { tagline: { $regex: options.search, $options: "i" } },
      ]
    }

    const docs = await db
      .collection("studio_media")
      .find(query)
      .sort({ createdAt: -1 })
      .limit(options?.limit ?? 100)
      .toArray()

    return docs.map((doc) => ({
      _id: doc._id.toString(),
      clerkId: doc.clerkId,
      key: doc.key,
      url: doc.url,
      kind: doc.kind,
      prompt: doc.prompt,
      tagline: doc.tagline,
      ratio: doc.ratio,
      style: doc.style,
      sizeBytes: doc.sizeBytes || 0,
      boardIds: doc.boardIds || [],
      visibility: doc.visibility || "private",
      isFavorite: Boolean(doc.isFavorite),
      deletedAt: doc.deletedAt ? new Date(doc.deletedAt).toISOString() : null,
      createdAt: new Date(doc.createdAt).toISOString(),
      updatedAt: new Date(doc.updatedAt).toISOString(),
    }))
  } catch (error) {
    console.error("Error getting user media items:", error)
    return []
  }
}

/**
 * Updates a media item (prompt, tagline, visibility, favorite, board assignments)
 */
export async function updateMediaItem(
  clerkId: string,
  mediaId: string,
  updates: {
    prompt?: string
    tagline?: string
    visibility?: "public" | "private"
    isFavorite?: boolean
    boardIds?: string[]
  }
): Promise<{ ok: boolean; error?: string }> {
  const db = await getDb()
  if (!db) return { ok: false, error: "Database offline." }

  try {
    const res = await db.collection("studio_media").updateOne(
      { _id: new ObjectId(mediaId), clerkId },
      {
        $set: {
          ...updates,
          updatedAt: new Date(),
        },
      }
    )
    return { ok: res.modifiedCount > 0 || res.matchedCount > 0 }
  } catch (error) {
    console.error("Error updating media item:", error)
    return { ok: false, error: "Could not update media item." }
  }
}

/**
 * Soft deletes media item moving it to 30-day Trash
 */
export async function softDeleteMediaItem(
  clerkId: string,
  mediaId: string
): Promise<{ ok: boolean; error?: string }> {
  const db = await getDb()
  if (!db) return { ok: false, error: "Database offline." }

  try {
    const res = await db.collection("studio_media").updateOne(
      { _id: new ObjectId(mediaId), clerkId },
      {
        $set: {
          deletedAt: new Date(),
          updatedAt: new Date(),
        },
      }
    )
    return { ok: res.modifiedCount > 0 }
  } catch (error) {
    console.error("Error soft deleting media item:", error)
    return { ok: false, error: "Could not delete media item." }
  }
}

/**
 * Restores a media item from Trash
 */
export async function restoreMediaItem(
  clerkId: string,
  mediaId: string
): Promise<{ ok: boolean; error?: string }> {
  const db = await getDb()
  if (!db) return { ok: false, error: "Database offline." }

  try {
    const res = await db.collection("studio_media").updateOne(
      { _id: new ObjectId(mediaId), clerkId },
      {
        $set: {
          deletedAt: null,
          updatedAt: new Date(),
        },
      }
    )
    return { ok: res.modifiedCount > 0 }
  } catch (error) {
    console.error("Error restoring media item:", error)
    return { ok: false, error: "Could not restore media item." }
  }
}

/**
 * Permanently deletes media item from R2 and MongoDB
 */
export async function permanentlyDeleteMediaItem(
  clerkId: string,
  mediaId: string
): Promise<{ ok: boolean; error?: string }> {
  const db = await getDb()
  if (!db) return { ok: false, error: "Database offline." }

  try {
    const item = await db.collection("studio_media").findOne({ _id: new ObjectId(mediaId), clerkId })
    if (!item) return { ok: false, error: "Item not found." }

    if (item.key) {
      await deleteObjectFromR2(item.key)
    }

    await db.collection("studio_media").deleteOne({ _id: new ObjectId(mediaId), clerkId })
    return { ok: true }
  } catch (error) {
    console.error("Error permanently deleting media item:", error)
    return { ok: false, error: "Could not delete permanently." }
  }
}

/**
 * Gets trashed items with 30-day expiration countdown
 */
export async function getTrashItems(
  clerkId: string
): Promise<Array<MediaItem & { daysRemaining: number }>> {
  const db = await getDb()
  if (!db) return []

  try {
    const docs = await db
      .collection("studio_media")
      .find({ clerkId, deletedAt: { $ne: null } })
      .sort({ deletedAt: -1 })
      .toArray()

    const now = Date.now()

    return docs.map((doc) => {
      const deletedTime = new Date(doc.deletedAt).getTime()
      const elapsedDays = Math.floor((now - deletedTime) / (1000 * 60 * 60 * 24))
      const daysRemaining = Math.max(0, TRASH_RETENTION_DAYS - elapsedDays)

      return {
        _id: doc._id.toString(),
        clerkId: doc.clerkId,
        key: doc.key,
        url: doc.url,
        kind: doc.kind,
        prompt: doc.prompt,
        tagline: doc.tagline,
        ratio: doc.ratio,
        style: doc.style,
        sizeBytes: doc.sizeBytes || 0,
        boardIds: doc.boardIds || [],
        visibility: doc.visibility || "private",
        isFavorite: Boolean(doc.isFavorite),
        deletedAt: new Date(doc.deletedAt).toISOString(),
        createdAt: new Date(doc.createdAt).toISOString(),
        updatedAt: new Date(doc.updatedAt).toISOString(),
        daysRemaining,
      }
    })
  } catch (error) {
    console.error("Error getting trash items:", error)
    return []
  }
}

/**
 * Empties all items in trash for a user
 */
export async function emptyTrash(clerkId: string): Promise<{ ok: boolean; count: number }> {
  const db = await getDb()
  if (!db) return { ok: false, count: 0 }

  try {
    const trashed = await db.collection("studio_media").find({ clerkId, deletedAt: { $ne: null } }).toArray()

    for (const item of trashed) {
      if (item.key) {
        await deleteObjectFromR2(item.key)
      }
    }

    const res = await db.collection("studio_media").deleteMany({ clerkId, deletedAt: { $ne: null } })
    return { ok: true, count: res.deletedCount }
  } catch (error) {
    console.error("Error emptying trash:", error)
    return { ok: false, count: 0 }
  }
}
