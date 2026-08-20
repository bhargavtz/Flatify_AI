import { auth, currentUser } from "@clerk/nextjs/server"
import { db, isDbConfigured } from "@/lib/db"
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
import type { StudioProfile, StudioWork } from "@prisma/client"

let seeded = false

async function ensureSeed(): Promise<void> {
  if (seeded || !isDbConfigured()) return
  try {
    const count = await db.studioWork.count()
    if (count > 0) {
      seeded = true
      return
    }

    for (const author of SEED_AUTHORS) {
      await db.studioProfile.upsert({
        where: { username: author.username },
        update: {},
        create: {
          clerkId: `seed:${author.username}`,
          username: author.username,
          displayName: author.displayName,
          tagline: author.tagline,
          avatarUrl: author.avatarUrl,
        },
      })
    }

    for (const work of SEED_WORKS) {
      await db.studioWork.upsert({
        where: { slug: work.slug },
        update: {},
        create: {
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
        },
      })
    }

    for (const comment of SEED_COMMENTS) {
      await db.studioComment.create({
        data: {
          slug: comment.slug,
          clerkId: `seed:${comment.author.username}`,
          authorUsername: comment.author.username,
          authorName: comment.author.displayName,
          authorAvatarUrl: comment.author.avatarUrl,
          body: comment.body,
          createdAt: new Date(comment.createdAt),
        },
      })
    }
    seeded = true
  } catch (error) {
    console.error("Studio seed error:", error)
  }
}

function toPublicWork(doc: StudioWork, profileMap: Map<string, StudioProfile>, liked: boolean): PublicWork {
  const profile = profileMap.get(doc.clerkId)
  const author: PublicAuthor = profile
    ? {
        username: profile.username,
        displayName: profile.displayName,
        tagline: profile.tagline,
        avatarUrl: profile.avatarUrl,
      }
    : {
        username: "maker",
        displayName: "Studio maker",
        tagline: "Frames on the table.",
        avatarUrl: null,
      }

  return {
    slug: doc.slug,
    kind: doc.kind as WorkKind,
    prompt: doc.prompt,
    tagline: doc.tagline,
    ratio: doc.ratio,
    paper: doc.paper ?? undefined,
    motion: doc.motion ?? undefined,
    length: doc.length ?? undefined,
    palette: (doc.palette.length === 3 ? doc.palette : ["#222", "#444", "#888"]) as [string, string, string],
    likeCount: doc.likeCount,
    commentCount: doc.commentCount,
    featured: doc.featured,
    createdAt: doc.createdAt.toISOString(),
    author,
    liked,
  }
}

async function likedSet(clerkId: string | null, slugs: string[]): Promise<Set<string>> {
  if (!clerkId || slugs.length === 0 || !isDbConfigured()) return new Set()
  try {
    const rows = await db.studioLike.findMany({
      where: {
        clerkId,
        slug: { in: slugs },
      },
      select: { slug: true },
    })
    return new Set(rows.map((row) => row.slug))
  } catch {
    return new Set()
  }
}

export async function listWorks(
  kind: WorkKind | "all",
  sort: ExploreSort,
  clerkId: string | null
): Promise<PublicWork[]> {
  if (!isDbConfigured()) {
    const rows = kind === "all" ? SEED_WORKS : SEED_WORKS.filter((work) => work.kind === kind)
    const ordered = [...rows].sort((a, b) =>
      sort === "loved" ? b.likeCount - a.likeCount : b.createdAt.localeCompare(a.createdAt)
    )
    return ordered
  }

  try {
    await ensureSeed()
    const where = kind === "all" ? {} : { kind }
    const orderBy = sort === "loved" ? [{ likeCount: "desc" as const }, { createdAt: "desc" as const }] : [{ createdAt: "desc" as const }]

    const docs = await db.studioWork.findMany({
      where,
      orderBy,
      take: 80,
    })

    const clerkIds = Array.from(new Set(docs.map((d) => d.clerkId)))
    const profiles = await db.studioProfile.findMany({
      where: { clerkId: { in: clerkIds } },
    })
    const profileMap = new Map(profiles.map((p) => [p.clerkId, p]))

    const liked = await likedSet(
      clerkId,
      docs.map((doc) => doc.slug)
    )
    return docs.map((doc) => toPublicWork(doc, profileMap, liked.has(doc.slug)))
  } catch (error) {
    console.error("Studio listWorks error:", error)
    const rows = kind === "all" ? SEED_WORKS : SEED_WORKS.filter((work) => work.kind === kind)
    return [...rows].sort((a, b) =>
      sort === "loved" ? b.likeCount - a.likeCount : b.createdAt.localeCompare(a.createdAt)
    )
  }
}

export async function getWork(slug: string, clerkId: string | null): Promise<PublicWork | null> {
  if (!isDbConfigured()) {
    return SEED_WORKS.find((work) => work.slug === slug) ?? null
  }

  try {
    await ensureSeed()
    const doc = await db.studioWork.findUnique({
      where: { slug },
    })
    if (!doc) return null

    const profile = await db.studioProfile.findUnique({
      where: { clerkId: doc.clerkId },
    })
    const profileMap = new Map<string, StudioProfile>()
    if (profile) profileMap.set(profile.clerkId, profile)

    const liked = await likedSet(clerkId, [slug])
    return toPublicWork(doc, profileMap, liked.has(slug))
  } catch (error) {
    console.error("Studio getWork error:", error)
    return SEED_WORKS.find((work) => work.slug === slug) ?? null
  }
}

export async function listComments(slug: string): Promise<PublicComment[]> {
  if (!isDbConfigured()) {
    return SEED_COMMENTS.filter((comment) => comment.slug === slug).map(({ slug: _s, ...rest }) => rest)
  }

  try {
    await ensureSeed()
    const docs = await db.studioComment.findMany({
      where: { slug },
      orderBy: { createdAt: "asc" },
      take: 80,
    })

    return docs.map((doc) => ({
      id: doc.id,
      body: doc.body,
      createdAt: doc.createdAt.toISOString(),
      author: {
        username: doc.authorUsername,
        displayName: doc.authorName,
        avatarUrl: doc.authorAvatarUrl,
      },
    }))
  } catch (error) {
    console.error("Studio listComments error:", error)
    return SEED_COMMENTS.filter((comment) => comment.slug === slug).map(({ slug: _s, ...rest }) => rest)
  }
}

export async function getProfile(username: string, clerkId: string | null): Promise<PublicProfile | null> {
  if (!isDbConfigured()) {
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

  try {
    await ensureSeed()
    const profile = await db.studioProfile.findUnique({
      where: { username },
    })
    if (!profile) return null

    const docs = await db.studioWork.findMany({
      where: { clerkId: profile.clerkId },
      orderBy: { createdAt: "desc" },
      take: 40,
    })

    const profileMap = new Map<string, StudioProfile>([[profile.clerkId, profile]])
    const liked = await likedSet(
      clerkId,
      docs.map((doc) => doc.slug)
    )

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
      works: docs.map((doc) => toPublicWork(doc, profileMap, liked.has(doc.slug))),
    }
  } catch (error) {
    console.error("Studio getProfile error:", error)
    return null
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
  if (!isDbConfigured()) {
    return {
      username: user.username || `maker.${user.id.slice(-6).toLowerCase()}`,
      displayName: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.username || "Studio maker",
      tagline: "Frames on the table.",
      avatarUrl: user.imageUrl ?? null,
    }
  }

  try {
    const existing = await db.studioProfile.findUnique({
      where: { clerkId: user.id },
    })

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

    const taken = await db.studioProfile.findUnique({ where: { username } })
    if (taken) username = `${username}.${user.id.slice(-4).toLowerCase()}`

    const created = await db.studioProfile.create({
      data: {
        clerkId: user.id,
        username,
        displayName,
        tagline: "Frames on the table.",
        avatarUrl: user.imageUrl ?? null,
      },
    })

    return {
      username: created.username,
      displayName: created.displayName,
      tagline: created.tagline,
      avatarUrl: created.avatarUrl,
    }
  } catch (error) {
    console.error("Studio upsertMyProfile error:", error)
    return null
  }
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
  if (!isDbConfigured()) return null

  await upsertMyProfile()

  try {
    const data: Partial<StudioProfile> = {}
    if (input.tagline !== undefined) data.tagline = input.tagline.trim().slice(0, 120) || "Frames on the table."
    if (input.displayName !== undefined) {
      const name = input.displayName.trim().slice(0, 48)
      if (name) data.displayName = name
    }
    if (input.bio !== undefined) data.bio = input.bio.trim().slice(0, 400)
    if (input.location !== undefined) data.location = input.location.trim().slice(0, 80)
    if (input.website !== undefined) {
      data.website = safeWebsite(input.website)
    }
    if (input.avatarUrl !== undefined) {
      if (input.avatarUrl === null || input.avatarUrl === "") {
        data.avatarUrl = null
      } else {
        const stored = await storeUserMedia(userId, "avatar", input.avatarUrl)
        if (typeof stored === "object") return null
        data.avatarUrl = stored
      }
    }
    if (input.coverUrl !== undefined) {
      if (input.coverUrl === null || input.coverUrl === "") {
        data.coverUrl = null
      } else {
        const stored = await storeUserMedia(userId, "cover", input.coverUrl)
        if (typeof stored === "object") return null
        data.coverUrl = stored
      }
    }

    const updated = await db.studioProfile.update({
      where: { clerkId: userId },
      data,
    })

    return {
      username: updated.username,
      displayName: updated.displayName,
      tagline: updated.tagline,
      avatarUrl: updated.avatarUrl,
    }
  } catch (error) {
    console.error("Studio updateMyProfile error:", error)
    return null
  }
}

export async function isMyUsername(username: string): Promise<boolean> {
  const { userId } = await auth()
  if (!userId || !isDbConfigured()) return false
  try {
    const profile = await db.studioProfile.findUnique({ where: { clerkId: userId } })
    return profile?.username === username
  } catch {
    return false
  }
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
  if (!isDbConfigured()) return { error: "Studio wall is offline. Try again in a moment." }

  const prompt = input.prompt.trim().slice(0, 800)
  const tagline = input.tagline.trim().slice(0, 140)
  if (prompt.length < 4) return { error: "Write a prompt first." }
  if (tagline.length < 4) return { error: "Add a short tagline for the wall." }
  if (input.kind !== "image" && input.kind !== "video") return { error: "Kind must be image or video." }

  const author = await upsertMyProfile()
  if (!author) return { error: "Could not open your profile." }

  try {
    let slug = slugify(tagline)
    const clash = await db.studioWork.findUnique({ where: { slug } })
    if (clash) slug = `${slug}-${Date.now().toString(36).slice(-4)}`

    const created = await db.studioWork.create({
      data: {
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
      },
    })

    const profile = await db.studioProfile.findUnique({ where: { clerkId: userId } })
    const profileMap = new Map<string, StudioProfile>()
    if (profile) profileMap.set(profile.clerkId, profile)

    return toPublicWork(created, profileMap, false)
  } catch (error) {
    console.error("Studio publishWork error:", error)
    return { error: "Failed to publish work." }
  }
}

export async function toggleLike(slug: string): Promise<{ likeCount: number; liked: boolean } | { error: string }> {
  const { userId } = await auth()
  if (!userId) return { error: "Sign in to like." }
  if (!isDbConfigured()) return { error: "Studio wall is offline." }

  try {
    const work = await db.studioWork.findUnique({ where: { slug } })
    if (!work) return { error: "Work not found." }

    const existing = await db.studioLike.findUnique({
      where: {
        slug_clerkId: { slug, clerkId: userId },
      },
    })

    if (existing) {
      await db.$transaction([
        db.studioLike.delete({
          where: { slug_clerkId: { slug, clerkId: userId } },
        }),
        db.studioWork.update({
          where: { slug },
          data: { likeCount: { decrement: 1 } },
        }),
      ])
      return { likeCount: Math.max(0, work.likeCount - 1), liked: false }
    }

    await db.$transaction([
      db.studioLike.create({
        data: { slug, clerkId: userId },
      }),
      db.studioWork.update({
        where: { slug },
        data: { likeCount: { increment: 1 } },
      }),
    ])
    return { likeCount: work.likeCount + 1, liked: true }
  } catch (error) {
    console.error("Studio toggleLike error:", error)
    return { error: "Could not update like." }
  }
}

export async function addComment(slug: string, body: string): Promise<PublicComment | { error: string }> {
  const { userId } = await auth()
  if (!userId) return { error: "Sign in to comment." }
  const text = body.trim().slice(0, 400)
  if (text.length < 2) return { error: "Write a comment." }

  if (!isDbConfigured()) return { error: "Studio wall is offline." }

  try {
    const work = await db.studioWork.findUnique({ where: { slug } })
    if (!work) return { error: "Work not found." }

    const author = await upsertMyProfile()
    if (!author) return { error: "Could not open your profile." }

    const [comment] = await db.$transaction([
      db.studioComment.create({
        data: {
          slug,
          clerkId: userId,
          authorUsername: author.username,
          authorName: author.displayName,
          authorAvatarUrl: author.avatarUrl,
          body: text,
        },
      }),
      db.studioWork.update({
        where: { slug },
        data: { commentCount: { increment: 1 } },
      }),
    ])

    return {
      id: comment.id,
      body: text,
      createdAt: comment.createdAt.toISOString(),
      author: {
        username: author.username,
        displayName: author.displayName,
        avatarUrl: author.avatarUrl,
      },
    }
  } catch (error) {
    console.error("Studio addComment error:", error)
    return { error: "Could not save comment." }
  }
}

export async function viewerId(): Promise<string | null> {
  const { userId } = await auth()
  return userId
}

export function isError<T>(value: T | { error: string }): value is { error: string } {
  return typeof value === "object" && value !== null && "error" in value
}
