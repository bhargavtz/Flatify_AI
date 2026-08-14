import { type Collection, type Db } from "mongodb"
import { auth, currentUser } from "@clerk/nextjs/server"
import clientPromise from "@/lib/mongodb"
import { SEED_AUTHORS, SEED_COMMENTS, SEED_WORKS } from "@/lib/explore-seed"
import { isSafeMediaUrl, storeUserMedia } from "@/lib/storage"
import {
  paletteFromPrompt,
  slugify,
  type ExploreSort,
  type PublicAuthor,
  type PublicComment,
  type PublicProfile,
  type PublicWork,
  type WorkKind,
} from "@/lib/social-types"

interface WorkDoc {
  slug: string
  clerkId: string
  kind: WorkKind
  prompt: string
  tagline: string
  ratio: string
  paper?: string
  motion?: string
  length?: string
  palette: [string, string, string]
  likeCount: number
  commentCount: number
  featured: boolean
  createdAt: Date
  author: PublicAuthor
}

interface ProfileDoc extends PublicAuthor {
  clerkId: string
  bio?: string
  coverUrl?: string | null
  location?: string
  website?: string
  updatedAt: Date
}

interface LikeDoc {
  slug: string
  clerkId: string
}

interface CommentDoc {
  _id?: { toString(): string }
  slug: string
  clerkId: string
  body: string
  createdAt: Date
  author: PublicComment["author"]
}

async function studioDb(): Promise<Db | null> {
  try {
    const client = await clientPromise
    return client.db()
  } catch (error) {
    console.error("Studio social DB unavailable:", error)
    return null
  }
}

async function cols(db: Db): Promise<{
  works: Collection<WorkDoc>
  profiles: Collection<ProfileDoc>
  likes: Collection<LikeDoc>
  comments: Collection<CommentDoc>
}> {
  const works = db.collection<WorkDoc>("studio_works")
  const profiles = db.collection<ProfileDoc>("studio_profiles")
  const likes = db.collection<LikeDoc>("studio_likes")
  const comments = db.collection<CommentDoc>("studio_comments")
  return { works, profiles, likes, comments }
}

let seeded = false

async function ensureSeed(db: Db): Promise<void> {
  if (seeded) return
  const { works, profiles, comments } = await cols(db)

  await Promise.all(
    SEED_AUTHORS.map((author) =>
      profiles.updateOne(
        { username: author.username },
        {
          $setOnInsert: {
            clerkId: `seed:${author.username}`,
            ...author,
            updatedAt: new Date(),
          },
        },
        { upsert: true }
      )
    )
  )

  await Promise.all(
    SEED_WORKS.map((work) =>
      works.updateOne(
        { slug: work.slug },
        {
          $setOnInsert: {
            slug: work.slug,
            clerkId: `seed:${work.author.username}`,
            kind: work.kind,
            prompt: work.prompt,
            tagline: work.tagline,
            ratio: work.ratio,
            paper: work.paper,
            motion: work.motion,
            length: work.length,
            palette: work.palette,
            likeCount: work.likeCount,
            commentCount: work.commentCount,
            featured: work.featured,
            createdAt: new Date(work.createdAt),
            author: work.author,
          },
        },
        { upsert: true }
      )
    )
  )

  await Promise.all(
    SEED_COMMENTS.map((comment) =>
      comments.updateOne(
        { slug: comment.slug, body: comment.body, "author.username": comment.author.username },
        {
          $setOnInsert: {
            slug: comment.slug,
            clerkId: `seed:${comment.author.username}`,
            body: comment.body,
            createdAt: new Date(comment.createdAt),
            author: comment.author,
          },
        },
        { upsert: true }
      )
    )
  )

  seeded = true
}

function toPublicWork(doc: WorkDoc, liked: boolean): PublicWork {
  return {
    slug: doc.slug,
    kind: doc.kind,
    prompt: doc.prompt,
    tagline: doc.tagline,
    ratio: doc.ratio,
    paper: doc.paper,
    motion: doc.motion,
    length: doc.length,
    palette: doc.palette,
    likeCount: doc.likeCount,
    commentCount: doc.commentCount,
    featured: doc.featured,
    createdAt: doc.createdAt.toISOString(),
    author: doc.author,
    liked,
  }
}

async function likedSet(db: Db, clerkId: string | null, slugs: string[]): Promise<Set<string>> {
  if (!clerkId || slugs.length === 0) return new Set()
  const { likes } = await cols(db)
  const rows = await likes.find({ clerkId, slug: { $in: slugs } }).toArray()
  return new Set(rows.map((row) => row.slug))
}

export async function listWorks(kind: WorkKind | "all", sort: ExploreSort, clerkId: string | null): Promise<PublicWork[]> {
  const db = await studioDb()
  if (!db) {
    const rows = kind === "all" ? SEED_WORKS : SEED_WORKS.filter((work) => work.kind === kind)
    const ordered = [...rows].sort((a, b) =>
      sort === "loved" ? b.likeCount - a.likeCount : b.createdAt.localeCompare(a.createdAt)
    )
    return ordered
  }

  await ensureSeed(db)
  const { works } = await cols(db)
  const cursor = kind === "all" ? works.find({}) : works.find({ kind })
  const docs =
    sort === "loved"
      ? await cursor.sort({ likeCount: -1, createdAt: -1 }).limit(80).toArray()
      : await cursor.sort({ createdAt: -1 }).limit(80).toArray()
  const liked = await likedSet(db, clerkId, docs.map((doc) => doc.slug))
  return docs.map((doc) => toPublicWork(doc, liked.has(doc.slug)))
}

export async function getWork(slug: string, clerkId: string | null): Promise<PublicWork | null> {
  const db = await studioDb()
  if (!db) {
    return SEED_WORKS.find((work) => work.slug === slug) ?? null
  }
  await ensureSeed(db)
  const { works } = await cols(db)
  const doc = await works.findOne({ slug })
  if (!doc) return null
  const liked = await likedSet(db, clerkId, [slug])
  return toPublicWork(doc, liked.has(slug))
}

export async function listComments(slug: string): Promise<PublicComment[]> {
  const db = await studioDb()
  if (!db) {
    return SEED_COMMENTS.filter((comment) => comment.slug === slug).map(({ slug: _s, ...rest }) => rest)
  }
  await ensureSeed(db)
  const { comments } = await cols(db)
  const docs = await comments.find({ slug }).sort({ createdAt: 1 }).limit(80).toArray()
  return docs.map((doc) => ({
    id: doc._id ? doc._id.toString() : `${doc.slug}-${doc.createdAt.getTime()}`,
    body: doc.body,
    createdAt: doc.createdAt.toISOString(),
    author: doc.author,
  }))
}

export async function getProfile(username: string, clerkId: string | null): Promise<PublicProfile | null> {
  const db = await studioDb()
  if (!db) {
    const author = SEED_AUTHORS.find((row) => row.username === username)
    if (!author) return null
    const works = SEED_WORKS.filter((work) => work.author.username === username)
    return {
      ...author,
      bio: "",
      coverUrl: null,
      location: "",
      website: "",
      workCount: works.length,
      works,
    }
  }
  await ensureSeed(db)
  const { profiles, works } = await cols(db)
  const profile = await profiles.findOne({ username })
  if (!profile) return null
  const docs = await works.find({ "author.username": username }).sort({ createdAt: -1 }).limit(40).toArray()
  const liked = await likedSet(db, clerkId, docs.map((doc) => doc.slug))
  return {
    username: profile.username,
    displayName: profile.displayName,
    tagline: profile.tagline,
    avatarUrl: publicMedia(profile.avatarUrl),
    bio: profile.bio ?? "",
    coverUrl: publicMedia(profile.coverUrl),
    location: profile.location ?? "",
    website: safeWebsite(profile.website ?? ""),
    workCount: docs.length,
    works: docs.map((doc) => toPublicWork(doc, liked.has(doc.slug))),
  }
}

function handleFromUser(params: {
  username?: string | null
  firstName?: string | null
  lastName?: string | null
  id: string
}): string {
  if (params.username) return slugify(params.username).replace(/-/g, ".")
  const name = `${params.firstName ?? ""} ${params.lastName ?? ""}`.trim()
  if (name) return slugify(name).replace(/-/g, ".")
  return `maker.${params.id.slice(-6).toLowerCase()}`
}

function safeWebsite(raw: string): string {
  const site = raw.trim().slice(0, 120)
  if (!site) return ""
  if (/^(javascript|data|vbscript):/i.test(site)) return ""
  if (/^https:\/\//i.test(site)) return site
  if (/^http:\/\//i.test(site)) return `https://${site.slice("http://".length)}`
  return `https://${site}`
}

function publicMedia(url: string | null | undefined): string | null {
  if (!url) return null
  return isSafeMediaUrl(url) ? url : null
}

export async function upsertMyProfile(): Promise<PublicAuthor | null> {
  const user = await currentUser()
  if (!user) return null
  const db = await studioDb()
  if (!db) return null

  const { profiles } = await cols(db)
  const existing = await profiles.findOne({ clerkId: user.id })
  if (existing) {
    return {
      username: existing.username,
      displayName: existing.displayName,
      tagline: existing.tagline,
      avatarUrl: existing.avatarUrl,
    }
  }

  const displayName =
    `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() ||
    user.username ||
    "Studio maker"
  let username = handleFromUser({
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    id: user.id,
  })

  const taken = await profiles.findOne({ username })
  if (taken) username = `${username}.${user.id.slice(-4).toLowerCase()}`

  const author: PublicAuthor = {
    username,
    displayName,
    tagline: "Frames on the table.",
    avatarUrl: user.imageUrl ?? null,
  }

  await profiles.insertOne({
    clerkId: user.id,
    ...author,
    updatedAt: new Date(),
  })
  return author
}

export async function updateMyProfile(input: {
  tagline?: string
  displayName?: string
  bio?: string
  location?: string
  website?: string
  avatarUrl?: string | null
  coverUrl?: string | null
}): Promise<PublicAuthor | null> {
  const { userId } = await auth()
  if (!userId) return null
  const db = await studioDb()
  if (!db) return null
  await upsertMyProfile()
  const { profiles, works } = await cols(db)

  const patch: Partial<ProfileDoc> = { updatedAt: new Date() }
  if (input.tagline !== undefined) patch.tagline = input.tagline.trim().slice(0, 120) || "Frames on the table."
  if (input.displayName !== undefined) {
    const name = input.displayName.trim().slice(0, 48)
    if (name) patch.displayName = name
  }
  if (input.bio !== undefined) patch.bio = input.bio.trim().slice(0, 400)
  if (input.location !== undefined) patch.location = input.location.trim().slice(0, 80)
  if (input.website !== undefined) {
    patch.website = safeWebsite(input.website)
  }
  if (input.avatarUrl !== undefined) {
    if (input.avatarUrl === null || input.avatarUrl === "") {
      patch.avatarUrl = null
    } else {
      const stored = await storeUserMedia(userId, "avatar", input.avatarUrl)
      if (typeof stored === "object") return null
      patch.avatarUrl = stored
    }
  }
  if (input.coverUrl !== undefined) {
    if (input.coverUrl === null || input.coverUrl === "") {
      patch.coverUrl = null
    } else {
      const stored = await storeUserMedia(userId, "cover", input.coverUrl)
      if (typeof stored === "object") return null
      patch.coverUrl = stored
    }
  }

  await profiles.updateOne({ clerkId: userId }, { $set: patch })
  const profile = await profiles.findOne({ clerkId: userId })
  if (!profile) return null

  await works.updateMany(
    { clerkId: userId },
    {
      $set: {
        "author.displayName": profile.displayName,
        "author.tagline": profile.tagline,
        "author.avatarUrl": profile.avatarUrl,
      },
    }
  )

  return {
    username: profile.username,
    displayName: profile.displayName,
    tagline: profile.tagline,
    avatarUrl: profile.avatarUrl,
  }
}

export async function isMyUsername(username: string): Promise<boolean> {
  const { userId } = await auth()
  if (!userId) return false
  const db = await studioDb()
  if (!db) return false
  const { profiles } = await cols(db)
  const profile = await profiles.findOne({ clerkId: userId })
  return profile?.username === username
}

export async function publishWork(input: {
  kind: WorkKind
  prompt: string
  tagline: string
  ratio: string
  paper?: string
  motion?: string
  length?: string
}): Promise<PublicWork | { error: string }> {
  const { userId } = await auth()
  if (!userId) return { error: "Sign in to publish." }
  const db = await studioDb()
  if (!db) return { error: "Studio wall is offline. Try again in a moment." }

  const prompt = input.prompt.trim().slice(0, 800)
  const tagline = input.tagline.trim().slice(0, 140)
  if (prompt.length < 4) return { error: "Write a prompt first." }
  if (tagline.length < 4) return { error: "Add a short tagline for the wall." }
  if (input.kind !== "image" && input.kind !== "video") return { error: "Kind must be image or video." }

  const author = await upsertMyProfile()
  if (!author) return { error: "Could not open your profile." }

  const { works } = await cols(db)
  let slug = slugify(tagline)
  const clash = await works.findOne({ slug })
  if (clash) slug = `${slug}-${Date.now().toString(36).slice(-4)}`

  const doc: WorkDoc = {
    slug,
    clerkId: userId,
    kind: input.kind,
    prompt,
    tagline,
    ratio: input.ratio.slice(0, 8),
    paper: input.paper?.slice(0, 24),
    motion: input.motion?.slice(0, 24),
    length: input.length?.slice(0, 8),
    palette: paletteFromPrompt(prompt),
    likeCount: 0,
    commentCount: 0,
    featured: false,
    createdAt: new Date(),
    author,
  }

  await works.insertOne(doc)
  return toPublicWork(doc, false)
}

export async function toggleLike(slug: string): Promise<{ likeCount: number; liked: boolean } | { error: string }> {
  const { userId } = await auth()
  if (!userId) return { error: "Sign in to like." }
  const db = await studioDb()
  if (!db) return { error: "Studio wall is offline." }

  const { works, likes } = await cols(db)
  const work = await works.findOne({ slug })
  if (!work) return { error: "Work not found." }

  const existing = await likes.findOne({ slug, clerkId: userId })
  if (existing) {
    await likes.deleteOne({ slug, clerkId: userId })
    await works.updateOne({ slug }, { $inc: { likeCount: -1 } })
    return { likeCount: Math.max(0, work.likeCount - 1), liked: false }
  }

  await likes.insertOne({ slug, clerkId: userId })
  await works.updateOne({ slug }, { $inc: { likeCount: 1 } })
  return { likeCount: work.likeCount + 1, liked: true }
}

export async function addComment(slug: string, body: string): Promise<PublicComment | { error: string }> {
  const { userId } = await auth()
  if (!userId) return { error: "Sign in to comment." }
  const text = body.trim().slice(0, 400)
  if (text.length < 2) return { error: "Write a comment." }

  const db = await studioDb()
  if (!db) return { error: "Studio wall is offline." }

  const { works, comments } = await cols(db)
  const work = await works.findOne({ slug })
  if (!work) return { error: "Work not found." }

  const author = await upsertMyProfile()
  if (!author) return { error: "Could not open your profile." }

  const doc: CommentDoc = {
    slug,
    clerkId: userId,
    body: text,
    createdAt: new Date(),
    author: {
      username: author.username,
      displayName: author.displayName,
      avatarUrl: author.avatarUrl,
    },
  }
  const result = await comments.insertOne(doc)
  await works.updateOne({ slug }, { $inc: { commentCount: 1 } })

  return {
    id: String(result.insertedId),
    body: text,
    createdAt: doc.createdAt.toISOString(),
    author: doc.author,
  }
}

export async function viewerId(): Promise<string | null> {
  const { userId } = await auth()
  return userId
}

export function isError<T>(value: T | { error: string }): value is { error: string } {
  return typeof value === "object" && value !== null && "error" in value
}
