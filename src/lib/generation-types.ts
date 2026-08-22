export type GenerationStatus =
  | "queued"
  | "processing"
  | "retrying"
  | "completed"
  | "failed"
  | "cancelled"
  | "provider_unavailable"

export interface CreativeDirection {
  number: number
  name: string
  kicker: string
  compositionGuidance: string
  modifier: string
}

export const CREATIVE_DIRECTIONS: CreativeDirection[] = [
  {
    number: 1,
    name: "Hero / Master Shot",
    kicker: "01 MASTER",
    compositionGuidance: "Centric primary hero composition, clear subject emphasis, balanced rule of thirds, natural depth of field, high visual hierarchy.",
    modifier: "master shot, clear subject focus, balanced natural depth, commercial quality lighting, highly detailed",
  },
  {
    number: 2,
    name: "Cinematic / 35mm Alternate",
    kicker: "02 CINEMATIC",
    compositionGuidance: "Wide atmospheric angle, dynamic perspective, 35mm anamorphic film lens perspective, dramatic environmental haze and twilight illumination.",
    modifier: "wide angle atmospheric composition, 35mm film perspective, cinematic twilight glow, subtle environmental haze, deep background perspective",
  },
  {
    number: 3,
    name: "Dynamic / Commercial Contrast",
    kicker: "03 DYNAMIC",
    compositionGuidance: "High energy lighting setup, crisp studio contrast, bold diagonal framing, clean edge highlights, vibrant commercial art direction.",
    modifier: "dynamic commercial composition, crisp edge highlights, dramatic studio contrast, vibrant color separation, clean studio art direction",
  },
  {
    number: 4,
    name: "Editorial / Minimalist",
    kicker: "04 EDITORIAL",
    compositionGuidance: "Artistic negative space, off-center framing, minimalist composition, soft natural ambient illumination, fine art editorial styling.",
    modifier: "editorial fine art composition, generous negative space, off-center aesthetic framing, soft ambient lighting, minimalist visual balance",
  },
]

export interface GenerationBatch {
  _id: string
  userId: string
  kind: "image" | "video"
  prompt: string
  aspectRatio: string
  paper?: string
  motion?: string
  length?: string
  requestedModel: string
  provider: string
  status: GenerationStatus
  takesCount: number
  completedTakes: number
  failedTakes: number
  createdAt: string
  updatedAt: string
  completedAt?: string | null
}

export interface GenerationTake {
  _id: string
  batchId: string
  userId: string
  takeNumber: number
  creativeDirection: string
  kicker: string
  directionPrompt: string
  status: GenerationStatus
  statusMessage?: string
  provider: string
  model: string
  providerJobId?: string | null
  generationAttemptId: string
  seed: number
  width: number
  height: number
  mimeType?: string | null
  sizeBytes?: number | null
  r2Key?: string | null
  url?: string | null
  mediaId?: string | null
  retryCount: number
  maxRetries: number
  nextRetryAt?: string | null
  errorCode?: string | null
  errorMessage?: string | null
  createdAt: string
  updatedAt: string
  completedAt?: string | null
}

export interface BatchDetailResponse {
  ok: boolean
  batch: GenerationBatch
  takes: GenerationTake[]
  isFinished: boolean
}
