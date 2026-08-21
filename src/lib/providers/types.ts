export interface ProviderCapabilities {
  supportedAspectRatios: string[]
  supportedDimensions: { width: number; height: number }[]
  supportsSeed: boolean
  supportsNegativePrompt: boolean
  supportsAsync: boolean
  supportsCancellation: boolean
  rateLimitPerMinute: number
  maxConcurrency: number
}

export interface ProviderGenerateRequest {
  prompt: string
  aspectRatio: string
  width: number
  height: number
  seed: number
  model?: string
  negativePrompt?: string
  attemptId: string
  apiKey?: string
  kind?: "image" | "video"
  motion?: string
}

export interface ProviderGenerateResponse {
  ok: boolean
  providerJobId?: string
  buffer?: ArrayBuffer
  mimeType?: string
  width: number
  height: number
  sizeBytes: number
  seed: number
  model: string
  isAsync?: boolean
  error?: NormalizedProviderError
}

export interface NormalizedProviderError {
  code: string
  message: string
  status?: number
  retryable: boolean
  retryAfterSeconds?: number
}

export interface ImageProvider {
  id: string
  name: string
  getCapabilities(): ProviderCapabilities
  generate(req: ProviderGenerateRequest): Promise<ProviderGenerateResponse>
  getStatus?(jobId: string, apiKey?: string): Promise<ProviderGenerateResponse>
  cancel?(jobId: string, apiKey?: string): Promise<boolean>
  normalizeError(error: any): NormalizedProviderError
}
