export type WorkKind = "image" | "video"
export type ExploreSort = "new" | "loved"
export type StudioPlanId = "FREE" | "STARTER" | "STUDIO" | "ENTERPRISE"
export type KeyProvider = "openai" | "openrouter" | "google" | "anthropic" | "replicate" | "fal"

export interface PublicAuthor {
  username: string
  displayName: string
  tagline: string
  avatarUrl: string | null
}

export interface PublicWork {
  slug: string
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
  createdAt: string
  author: PublicAuthor
  liked?: boolean
}

export interface PublicComment {
  id: string
  body: string
  createdAt: string
  author: Pick<PublicAuthor, "username" | "displayName" | "avatarUrl">
}

export interface PublicProfile extends PublicAuthor {
  workCount: number
  works: PublicWork[]
  bio: string
  coverUrl: string | null
  location: string
  website: string
}

export function slugify(value: string): string {
  const base = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 42)
  return base || "frame"
}

export function paletteFromPrompt(prompt: string): [string, string, string] {
  const palettes: [string, string, string][] = [
    ["#2F5BFF", "#12151C", "#E8A317"],
    ["#E8A317", "#1A1E28", "#FF4D3A"],
    ["#FF4D3A", "#12151C", "#F3F0EA"],
    ["#1A1E28", "#2F5BFF", "#9AA3B5"],
    ["#F3F0EA", "#12151C", "#2F5BFF"],
    ["#2F5BFF", "#FF4D3A", "#12151C"],
  ]
  let hash = 0
  for (let i = 0; i < prompt.length; i += 1) {
    hash = (hash * 31 + prompt.charCodeAt(i)) >>> 0
  }
  return palettes[hash % palettes.length] ?? palettes[0]
}
