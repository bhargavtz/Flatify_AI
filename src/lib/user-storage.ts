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

// In-memory synchronized media store
const memMedia = new Map<string, MediaItem>()

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
  const bytesTotal = USER_STORAGE_LIMIT_BYTES
  const db = await getDb()

  if (!db) {
    const userItems = Array.from(memMedia.values()).filter((i) => i.clerkId === clerkId)
    const activeItems = userItems.filter((i) => !i.deletedAt)
    const trashItems = userItems.filter((i) => Boolean(i.deletedAt))

    const bytesUsed = activeItems.reduce((acc, i) => acc + i.sizeBytes, 0)
    const itemsCount = activeItems.length
    const trashBytes = trashItems.reduce((acc, i) => acc + i.sizeBytes, 0)
    const trashCount = trashItems.length
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

    let bytesUsed = activeRes[0]?.totalBytes || 0
    let itemsCount = activeRes[0]?.count || 0
    const trashBytes = trashRes[0]?.totalBytes || 0
    const trashCount = trashRes[0]?.count || 0

    // Include any in-memory items not yet aggregated
    const memUserItems = Array.from(memMedia.values()).filter(
      (i) => i.clerkId === clerkId && !i.deletedAt
    )
    if (itemsCount === 0 && memUserItems.length > 0) {
      bytesUsed = memUserItems.reduce((acc, i) => acc + i.sizeBytes, 0)
      itemsCount = memUserItems.length
    }

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
  const quota = await getUserStorageQuota(input.clerkId)
  if (quota.bytesUsed + input.sizeBytes > USER_STORAGE_LIMIT_BYTES) {
    return {
      error: "Storage limit reached (500 MB). Please delete some items from your library or empty your trash.",
    }
  }

  const now = new Date()
  const itemId = new ObjectId().toString()
  const mediaItem: MediaItem = {
    _id: itemId,
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
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  }

  // Store in memory
  memMedia.set(itemId, mediaItem)

  const db = await getDb()
  if (db) {
    try {
      await db.collection("studio_media").insertOne({
        ...mediaItem,
        _id: itemId as any,
        createdAt: now,
        updatedAt: now,
      })
    } catch (err) {
      console.warn("MongoDB insert warning in saveMediaItem:", err)
    }
  }

  return { media: mediaItem }
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
  const itemsMap = new Map<string, MediaItem>()

  // Load from in-memory cache first
  Array.from(memMedia.values())
    .filter((i) => i.clerkId === clerkId && !i.deletedAt)
    .forEach((item) => itemsMap.set(item._id, item))

  const db = await getDb()
  if (db) {
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

      docs.forEach((doc) => {
        const id = doc._id.toString()
        const item: MediaItem = {
          _id: id,
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
        }
        itemsMap.set(id, item)
        memMedia.set(id, item)
      })
    } catch (error) {
      console.warn("MongoDB read warning in getUserMediaItems:", error)
    }
  }

  let results = Array.from(itemsMap.values())

  if (options?.kind) {
    results = results.filter((i) => i.kind === options.kind)
  }
  if (options?.boardId) {
    results = results.filter((i) => i.boardIds.includes(options.boardId!))
  }
  if (typeof options?.isFavorite === "boolean") {
    results = results.filter((i) => i.isFavorite === options.isFavorite)
  }
  if (options?.visibility) {
    results = results.filter((i) => i.visibility === options.visibility)
  }
  if (options?.search) {
    const s = options.search.toLowerCase()
    results = results.filter(
      (i) => i.prompt.toLowerCase().includes(s) || (i.tagline && i.tagline.toLowerCase().includes(s))
    )
  }

  return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

/**
 * Updates a media item (prompt, tagline, visibility, favorite, board assignments)
 */
export async function updateMediaItem(
  clerkId: string,
  mediaId: string,
  updates: Partial<Pick<MediaItem, "prompt" | "tagline" | "visibility" | "isFavorite" | "boardIds">>
): Promise<{ ok: boolean; media?: MediaItem; error?: string }> {
  const item = memMedia.get(mediaId)
  if (item && item.clerkId === clerkId) {
    Object.assign(item, updates, { updatedAt: new Date().toISOString() })
  }

  const db = await getDb()
  if (db) {
    try {
      let query: any = { _id: mediaId as any, clerkId }
      if (ObjectId.isValid(mediaId)) {
        query = { $or: [{ _id: mediaId }, { _id: new ObjectId(mediaId) }], clerkId }
      }
      await db.collection("studio_media").updateOne(query, {
        $set: { ...updates, updatedAt: new Date() },
      })
    } catch {
      /* ignore */
    }
  }

  return { ok: true, media: item || undefined }
}

/**
 * Soft deletes a media item (moves to 30-day trash retention)
 */
export async function softDeleteMediaItem(
  clerkId: string,
  mediaId: string
): Promise<{ ok: boolean; error?: string }> {
  const item = memMedia.get(mediaId)
  if (item && item.clerkId === clerkId) {
    item.deletedAt = new Date().toISOString()
  }

  const db = await getDb()
  if (db) {
    try {
      let query: any = { _id: mediaId as any, clerkId }
      if (ObjectId.isValid(mediaId)) {
        query = { $or: [{ _id: mediaId }, { _id: new ObjectId(mediaId) }], clerkId }
      }
      await db.collection("studio_media").updateOne(query, {
        $set: { deletedAt: new Date(), updatedAt: new Date() },
      })
    } catch (err: any) {
      return { ok: false, error: err?.message || "Failed to delete" }
    }
  }

  return { ok: true }
}

/**
 * Permanently deletes a media item and removes file from Cloudflare R2
 */
export async function permanentlyDeleteMediaItem(
  clerkId: string,
  mediaId: string
): Promise<{ ok: boolean; error?: string }> {
  const item = memMedia.get(mediaId)
  if (item && item.clerkId === clerkId) {
    memMedia.delete(mediaId)
    if (item.key) {
      void deleteObjectFromR2(item.key)
    }
  }

  const db = await getDb()
  if (db) {
    try {
      let query: any = { _id: mediaId as any, clerkId }
      if (ObjectId.isValid(mediaId)) {
        query = { $or: [{ _id: mediaId }, { _id: new ObjectId(mediaId) }], clerkId }
      }
      const doc = await db.collection("studio_media").findOne(query)
      if (doc?.key) {
        void deleteObjectFromR2(doc.key)
      }
      await db.collection("studio_media").deleteOne(query)
    } catch (err: any) {
      return { ok: false, error: err?.message || "Failed to purge" }
    }
  }

  return { ok: true }
}

/**
 * Fetches soft-deleted media items in trash
 */
export async function getTrashItems(clerkId: string): Promise<MediaItem[]> {
  const itemsMap = new Map<string, MediaItem>()

  Array.from(memMedia.values())
    .filter((i) => i.clerkId === clerkId && Boolean(i.deletedAt))
    .forEach((item) => itemsMap.set(item._id, item))

  const db = await getDb()
  if (db) {
    try {
      const docs = await db
        .collection("studio_media")
        .find({ clerkId, deletedAt: { $ne: null } })
        .sort({ deletedAt: -1 })
        .toArray()

      docs.forEach((doc) => {
        const id = doc._id.toString()
        const item: MediaItem = {
          _id: id,
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
        }
        itemsMap.set(id, item)
      })
    } catch {
      /* ignore */
    }
  }

  return Array.from(itemsMap.values())
}

/**
 * Restores a soft-deleted item from trash
 */
export async function restoreMediaItem(
  clerkId: string,
  mediaId: string
): Promise<{ ok: boolean; error?: string }> {
  const item = memMedia.get(mediaId)
  if (item && item.clerkId === clerkId) {
    item.deletedAt = null
  }

  const db = await getDb()
  if (db) {
    try {
      let query: any = { _id: mediaId as any, clerkId }
      if (ObjectId.isValid(mediaId)) {
        query = { $or: [{ _id: mediaId }, { _id: new ObjectId(mediaId) }], clerkId }
      }
      await db.collection("studio_media").updateOne(query, {
        $set: { deletedAt: null, updatedAt: new Date() },
      })
    } catch (err: any) {
      return { ok: false, error: err?.message || "Failed to restore" }
    }
  }

  return { ok: true }
}

/**
 * Empties all trash items for a user
 */
export async function emptyTrash(clerkId: string): Promise<{ ok: boolean; count: number; error?: string }> {
  let count = 0
  for (const [id, item] of memMedia.entries()) {
    if (item.clerkId === clerkId && Boolean(item.deletedAt)) {
      if (item.key) void deleteObjectFromR2(item.key)
      memMedia.delete(id)
      count++
    }
  }

  const db = await getDb()
  if (db) {
    try {
      const trashDocs = await db.collection("studio_media").find({ clerkId, deletedAt: { $ne: null } }).toArray()
      for (const doc of trashDocs) {
        if (doc.key) void deleteObjectFromR2(doc.key)
      }
      const res = await db.collection("studio_media").deleteMany({ clerkId, deletedAt: { $ne: null } })
      count = Math.max(count, res.deletedCount || 0)
    } catch (err: any) {
      return { ok: false, count, error: err?.message }
    }
  }

  return { ok: true, count }
}
