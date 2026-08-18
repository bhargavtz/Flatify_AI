import { auth } from "@clerk/nextjs/server"
import type { Collection, Db } from "mongodb"
import clientPromise from "@/lib/mongodb"
import { decryptSecret, encryptSecret, last4 } from "@/lib/secret"
import { KEY_PROVIDERS, STUDIO_PLANS, type GenerationRow, type SettingsBundle, type StoredKey } from "@/lib/settings-shared"
import { upsertMyProfile } from "@/lib/social"
import type { KeyProvider, StudioPlanId, WorkKind } from "@/lib/social-types"

export { KEY_PROVIDERS, STUDIO_PLANS }
export type { SettingsBundle, StoredKey, GenerationRow }

const COST_CENTS: Record<string, number> = {
  image: 12,
  video: 48,
  cut: 20,
  logo: 8,
}

const CREDIT_COST: Record<string, number> = {
  image: 2,
  video: 8,
  cut: 4,
  logo: 1,
}

interface JobDoc {
  _id?: { toString(): string }
  clerkId: string
  kind: string
  prompt: string
  creditsCost: number
  usdCents: number
  provider: string
  usedOwnKey: boolean
  createdAt: Date
}

interface KeyDoc {
  clerkId: string
  provider: KeyProvider
  last4: string
  encrypted: string
  active: boolean
  createdAt: Date
}

interface AccountDoc {
  clerkId: string
  plan: StudioPlanId
  useOwnKeys: boolean
  creditsUsed: number
  updatedAt: Date
}

async function db(): Promise<Db | null> {
  try {
    const client = await clientPromise
    return client.db()
  } catch (error) {
    console.error("Settings DB unavailable:", error)
    return null
  }
}

async function cols(mongo: Db): Promise<{
  jobs: Collection<JobDoc>
  keys: Collection<KeyDoc>
  accounts: Collection<AccountDoc>
}> {
  return {
    jobs: mongo.collection<JobDoc>("studio_jobs"),
    keys: mongo.collection<KeyDoc>("studio_keys"),
    accounts: mongo.collection<AccountDoc>("studio_accounts"),
  }
}

async function accountFor(clerkId: string): Promise<AccountDoc> {
  const mongo = await db()
  const fallback: AccountDoc = {
    clerkId,
    plan: "FREE",
    useOwnKeys: false,
    creditsUsed: 0,
    updatedAt: new Date(),
  }
  if (!mongo) return fallback
  const { accounts } = await cols(mongo)
  const existing = await accounts.findOne({ clerkId })
  if (existing) return existing
  await accounts.insertOne(fallback)
  return fallback
}

export async function getSettingsBundle(): Promise<SettingsBundle | { error: string }> {
  const { userId } = await auth()
  if (!userId) return { error: "Sign in to open settings." }
  const profile = await upsertMyProfile()
  if (!profile) return { error: "Could not open your profile." }

  const mongo = await db()
  const account = await accountFor(userId)
  const plan = STUDIO_PLANS.find((row) => row.id === account.plan) ?? STUDIO_PLANS[0]!

  let keys: StoredKey[] = []
  let generations: GenerationRow[] = []
  let published = 0
  let spentCents = 0
  let ownKeyRuns = 0
  let creditsUsed = account.creditsUsed

  if (mongo) {
    const { jobs, keys: keyCol } = await cols(mongo)
    const keyDocs = await keyCol.find({ clerkId: userId }).sort({ createdAt: -1 }).toArray()
    keys = keyDocs.map((row) => ({
      provider: row.provider,
      label: KEY_PROVIDERS.find((item) => item.id === row.provider)?.label ?? row.provider,
      last4: row.last4,
      active: row.active,
    }))

    const jobDocs = await jobs.find({ clerkId: userId }).sort({ createdAt: -1 }).limit(80).toArray()
    generations = jobDocs.map((row) => ({
      id: row._id ? row._id.toString() : `${row.createdAt.getTime()}`,
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

    published = await mongo.collection("studio_works").countDocuments({ clerkId: userId })
  }

  const full = await mongo
    ?.collection("studio_profiles")
    .findOne({ clerkId: userId })

  return {
    username: profile.username,
    displayName: (full?.displayName as string | undefined) ?? profile.displayName,
    tagline: (full?.tagline as string | undefined) ?? profile.tagline,
    bio: typeof full?.bio === "string" ? full.bio : "",
    location: typeof full?.location === "string" ? full.location : "",
    website: typeof full?.website === "string" ? full.website : "",
    avatarUrl: (full?.avatarUrl as string | null | undefined) ?? profile.avatarUrl,
    coverUrl: typeof full?.coverUrl === "string" ? full.coverUrl : null,
    plan: account.plan,
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
  const mongo = await db()
  if (!mongo) return { error: "Settings are offline." }
  const { accounts } = await cols(mongo)
  const patch: Partial<AccountDoc> = { updatedAt: new Date() }
  if (typeof input.useOwnKeys === "boolean") patch.useOwnKeys = input.useOwnKeys
  await accounts.updateOne({ clerkId: userId }, { $set: patch }, { upsert: true })
  return true
}

export async function assertCanGenerate(
  clerkId: string,
  kind: string,
  usedOwnKey: boolean
): Promise<true | { error: string }> {
  if (usedOwnKey) return true
  const account = await accountFor(clerkId)
  const plan = STUDIO_PLANS.find((row) => row.id === account.plan) ?? STUDIO_PLANS[0]!
  const cost = CREDIT_COST[kind] ?? 2
  if (account.creditsUsed + cost > plan.credits) {
    return { error: "No credits left. Upgrade on Pricing or use your own keys." }
  }
  return true
}

export async function saveUserKey(provider: KeyProvider, raw: string): Promise<true | { error: string }> {
  const { userId } = await auth()
  if (!userId) return { error: "Sign in to store a key." }
  const key = raw.trim()
  if (key.length < 16) return { error: "That key is too short." }
  if (!KEY_PROVIDERS.some((row) => row.id === provider)) return { error: "Unknown provider." }
  const mongo = await db()
  if (!mongo) return { error: "Settings are offline." }
  const { keys } = await cols(mongo)
  await keys.deleteMany({ clerkId: userId, provider })
  await keys.insertOne({
    clerkId: userId,
    provider,
    last4: last4(key),
    encrypted: encryptSecret(key),
    active: true,
    createdAt: new Date(),
  })
  return true
}

export async function removeUserKey(provider: KeyProvider): Promise<true | { error: string }> {
  const { userId } = await auth()
  if (!userId) return { error: "Sign in." }
  const mongo = await db()
  if (!mongo) return { error: "Settings are offline." }
  const { keys } = await cols(mongo)
  await keys.deleteMany({ clerkId: userId, provider })
  return true
}

export async function getActiveUserKey(
  clerkId: string,
  prefer: KeyProvider[]
): Promise<{ provider: KeyProvider; plain: string } | null> {
  const mongo = await db()
  if (!mongo) return null
  const { keys, accounts } = await cols(mongo)
  const account = await accounts.findOne({ clerkId })
  if (!account?.useOwnKeys) return null
  const docs = await keys.find({ clerkId, active: true }).toArray()
  for (const id of prefer) {
    const hit = docs.find((row) => row.provider === id)
    if (!hit) continue
    try {
      return { provider: hit.provider, plain: decryptSecret(hit.encrypted) }
    } catch {
      return null
    }
  }
  return null
}

export async function logGeneration(input: {
  clerkId: string
  kind: WorkKind | "cut" | "logo"
  prompt: string
  usedOwnKey: boolean
  provider: string
}): Promise<void> {
  const mongo = await db()
  if (!mongo) return
  const { jobs, accounts } = await cols(mongo)
  const creditsCost = input.usedOwnKey ? 0 : CREDIT_COST[input.kind] ?? 2
  const usdCents = input.usedOwnKey ? 0 : COST_CENTS[input.kind] ?? 12
  await jobs.insertOne({
    clerkId: input.clerkId,
    kind: input.kind,
    prompt: input.prompt.slice(0, 800),
    creditsCost,
    usdCents,
    provider: input.provider,
    usedOwnKey: input.usedOwnKey,
    createdAt: new Date(),
  })
  if (creditsCost > 0) {
    await accounts.updateOne(
      { clerkId: input.clerkId },
      { $inc: { creditsUsed: creditsCost }, $set: { updatedAt: new Date() } },
      { upsert: true }
    )
  }
}

export function isError<T>(value: T | { error: string }): value is { error: string } {
  return typeof value === "object" && value !== null && "error" in value
}
