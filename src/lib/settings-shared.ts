import type { KeyProvider, StudioPlanId } from "@/lib/social-types"

export const STUDIO_PLANS: Array<{
  id: StudioPlanId
  name: string
  monthly: number
  credits: number
  blurb: string
}> = [
  { id: "FREE", name: "Free", monthly: 0, credits: 100, blurb: "Learn the desks." },
  { id: "STARTER", name: "Starter", monthly: 19, credits: 1500, blurb: "Stills and short clips." },
  { id: "STUDIO", name: "Studio", monthly: 49, credits: 6000, blurb: "Weekly stills, clips, merges." },
  { id: "ENTERPRISE", name: "Enterprise", monthly: 199, credits: 30000, blurb: "Volume and your own keys." },
]

export const KEY_PROVIDERS: Array<{ id: KeyProvider; label: string; hint: string }> = [
  { id: "openai", label: "OpenAI", hint: "sk-…" },
  { id: "openrouter", label: "OpenRouter", hint: "sk-or-…" },
  { id: "google", label: "Google Gemini", hint: "AIza…" },
  { id: "anthropic", label: "Anthropic", hint: "sk-ant-…" },
  { id: "replicate", label: "Replicate", hint: "r8_…" },
  { id: "fal", label: "Fal", hint: "key…" },
]

export interface StoredKey {
  provider: KeyProvider
  label: string
  last4: string
  active: boolean
}

export interface GenerationRow {
  id: string
  kind: string
  prompt: string
  creditsCost: number
  usdCents: number
  provider: string
  usedOwnKey: boolean
  createdAt: string
}

export interface SettingsBundle {
  username: string
  displayName: string
  tagline: string
  bio: string
  location: string
  website: string
  avatarUrl: string | null
  coverUrl: string | null
  plan: StudioPlanId
  useOwnKeys: boolean
  creditsUsed: number
  creditsLeft: number
  creditsTotal: number
  totalGenerations: number
  published: number
  spentUsd: number
  ownKeyRuns: number
  keys: StoredKey[]
  generations: GenerationRow[]
}
