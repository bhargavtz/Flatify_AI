import { auth } from "@clerk/nextjs/server"
import { db, isDbConfigured } from "@/lib/db"
import { decryptSecret, encryptSecret, last4 } from "@/lib/secret"
import { KEY_PROVIDERS, STUDIO_PLANS, type GenerationRow, type SettingsBundle, type StoredKey } from "@/lib/settings-shared"
import { upsertMyProfile } from "@/lib/social"
import type { KeyProvider, StudioPlanId, WorkKind } from "@/lib/social-types"
import type { StudioAccount } from "@prisma/client"

export { KEY_PROVIDERS, STUDIO_PLANS }
export type { SettingsBundle, StoredKey, GenerationRow }

const COST_CENTS: Record<string, number> = {
  image: 12,
  video: 48,
  cut: 20,
}

const CREDIT_COST: Record<string, number> = {
  image: 2,
  video: 8,
  cut: 4,
}

async function accountFor(clerkId: string): Promise<StudioAccount> {
  const fallback: StudioAccount = {
    id: `fallback-${clerkId}`,
    clerkId,
    plan: "FREE",
    useOwnKeys: false,
    creditsUsed: 0,
    updatedAt: new Date(),
    createdAt: new Date(),
  }
  if (!isDbConfigured()) return fallback

  try {
    const existing = await db.studioAccount.findUnique({
      where: { clerkId },
    })
    if (existing) return existing

    return await db.studioAccount.create({
      data: {
        clerkId,
        plan: "FREE",
        useOwnKeys: false,
        creditsUsed: 0,
      },
    })
  } catch (error) {
    console.error("Settings accountFor error:", error)
    return fallback
  }
}

export async function getSettingsBundle(): Promise<SettingsBundle | { error: string }> {
  const { userId } = await auth()
  if (!userId) return { error: "Sign in to open settings." }
  const profile = await upsertMyProfile()
  if (!profile) return { error: "Could not open your profile." }

  const account = await accountFor(userId)
  const plan = STUDIO_PLANS.find((row) => row.id === account.plan) ?? STUDIO_PLANS[0]!

  let keys: StoredKey[] = []
  let generations: GenerationRow[] = []
  let published = 0
  let spentCents = 0
  let ownKeyRuns = 0
  let creditsUsed = account.creditsUsed

  if (isDbConfigured()) {
    try {
      const keyDocs = await db.studioKey.findMany({
        where: { clerkId: userId },
        orderBy: { createdAt: "desc" },
      })
      keys = keyDocs.map((row) => ({
        provider: row.provider as KeyProvider,
        label: KEY_PROVIDERS.find((item) => item.id === row.provider)?.label ?? row.provider,
        last4: row.last4,
        active: row.active,
      }))

      const jobDocs = await db.studioJob.findMany({
        where: { clerkId: userId },
        orderBy: { createdAt: "desc" },
        take: 80,
      })
      generations = jobDocs.map((row) => ({
        id: row.id,
        kind: row.kind,
        prompt: row.prompt,
        creditsCost: row.creditsCost,
        usdCents: row.usdCents,
        provider: row.provider,
        usedOwnKey: row.usedOwnKey,
        createdAt: row.createdAt.toISOString(),
      }))

      spentCents = jobDocs.filter((row) => !row.usedOwnKey).reduce((sum, row) => sum + row.usdCents, 0)
      ownKeyRuns = jobDocs.filter((row) => row.usedOwnKey).length
      creditsUsed = Math.max(account.creditsUsed, jobDocs.reduce((sum, row) => sum + row.creditsCost, 0))

      published = await db.studioWork.count({ where: { clerkId: userId } })
    } catch (error) {
      console.error("Settings getSettingsBundle data error:", error)
    }
  }

  let fullProfile = null
  if (isDbConfigured()) {
    try {
      fullProfile = await db.studioProfile.findUnique({ where: { clerkId: userId } })
    } catch {
      // Fall back gracefully
    }
  }

  return {
    username: profile.username,
    displayName: fullProfile?.displayName ?? profile.displayName,
    tagline: fullProfile?.tagline ?? profile.tagline,
    bio: fullProfile?.bio ?? "",
    location: fullProfile?.location ?? "",
    website: fullProfile?.website ?? "",
    avatarUrl: fullProfile?.avatarUrl ?? profile.avatarUrl,
    coverUrl: fullProfile?.coverUrl ?? null,
    plan: account.plan as StudioPlanId,
    useOwnKeys: account.useOwnKeys,
    creditsUsed,
    creditsTotal: plan.credits,
    creditsLeft: Math.max(0, plan.credits - creditsUsed),
    totalGenerations: generations.length,
    published,
    spentUsd: spentCents / 100,
    ownKeyRuns,
    keys,
    generations,
  }
}

export async function saveAccountFlags(input: {
  useOwnKeys?: boolean
}): Promise<true | { error: string }> {
  const { userId } = await auth()
  if (!userId) return { error: "Sign in." }
  if (!isDbConfigured()) return { error: "Settings are offline." }

  try {
    await db.studioAccount.upsert({
      where: { clerkId: userId },
      update: {
        ...(typeof input.useOwnKeys === "boolean" ? { useOwnKeys: input.useOwnKeys } : {}),
      },
      create: {
        clerkId: userId,
        plan: "FREE",
        useOwnKeys: input.useOwnKeys ?? false,
        creditsUsed: 0,
      },
    })
    return true
  } catch (error) {
    console.error("Settings saveAccountFlags error:", error)
    return { error: "Could not update settings." }
  }
}

export async function assertCanGenerate(
  clerkId: string,
  kind: string,
  usedOwnKey: boolean
): Promise<true | { error: string }> {
  // Always permit free generation
  void clerkId
  void kind
  void usedOwnKey
  return true
}

export async function saveUserKey(provider: KeyProvider, raw: string): Promise<true | { error: string }> {
  const { userId } = await auth()
  if (!userId) return { error: "Sign in to store a key." }
  const key = raw.trim()
  if (key.length < 16) return { error: "That key is too short." }
  if (!KEY_PROVIDERS.some((row) => row.id === provider)) return { error: "Unknown provider." }
  if (!isDbConfigured()) return { error: "Settings are offline." }

  try {
    await db.studioKey.upsert({
      where: {
        clerkId_provider: { clerkId: userId, provider },
      },
      update: {
        last4: last4(key),
        encrypted: encryptSecret(key),
        active: true,
      },
      create: {
        clerkId: userId,
        provider,
        last4: last4(key),
        encrypted: encryptSecret(key),
        active: true,
      },
    })
    return true
  } catch (error) {
    console.error("Settings saveUserKey error:", error)
    return { error: "Could not save key." }
  }
}

export async function removeUserKey(provider: KeyProvider): Promise<true | { error: string }> {
  const { userId } = await auth()
  if (!userId) return { error: "Sign in." }
  if (!isDbConfigured()) return { error: "Settings are offline." }

  try {
    await db.studioKey.deleteMany({
      where: { clerkId: userId, provider },
    })
    return true
  } catch (error) {
    console.error("Settings removeUserKey error:", error)
    return { error: "Could not remove key." }
  }
}

export async function getActiveUserKey(
  clerkId: string,
  prefer: KeyProvider[]
): Promise<{ provider: KeyProvider; plain: string } | null> {
  if (!isDbConfigured()) return null

  try {
    const account = await db.studioAccount.findUnique({ where: { clerkId } })
    if (!account?.useOwnKeys) return null

    const docs = await db.studioKey.findMany({
      where: { clerkId, active: true },
    })

    for (const id of prefer) {
      const hit = docs.find((row) => row.provider === id)
      if (!hit) continue
      try {
        return { provider: hit.provider as KeyProvider, plain: decryptSecret(hit.encrypted) }
      } catch {
        return null
      }
    }
    return null
  } catch {
    return null
  }
}

export async function logGeneration(input: {
  clerkId: string
  kind: WorkKind | "cut"
  prompt: string
  usedOwnKey: boolean
  provider: string
}): Promise<void> {
  if (!isDbConfigured()) return

  try {
    const creditsCost = input.usedOwnKey ? 0 : CREDIT_COST[input.kind] ?? 2
    const usdCents = input.usedOwnKey ? 0 : COST_CENTS[input.kind] ?? 12

    await db.studioJob.create({
      data: {
        clerkId: input.clerkId,
        kind: input.kind,
        prompt: input.prompt.slice(0, 800),
        creditsCost,
        usdCents,
        provider: input.provider,
        usedOwnKey: input.usedOwnKey,
      },
    })

    if (creditsCost > 0) {
      await db.studioAccount.upsert({
        where: { clerkId: input.clerkId },
        update: {
          creditsUsed: { increment: creditsCost },
        },
        create: {
          clerkId: input.clerkId,
          plan: "FREE",
          creditsUsed: creditsCost,
          useOwnKeys: false,
        },
      })
    }
  } catch (error) {
    console.error("Settings logGeneration error:", error)
  }
}

export function isError<T>(value: T | { error: string }): value is { error: string } {
  return typeof value === "object" && value !== null && "error" in value
}
