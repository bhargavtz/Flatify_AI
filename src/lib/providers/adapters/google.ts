import type {
  ImageProvider,
  ProviderCapabilities,
  ProviderGenerateRequest,
  ProviderGenerateResponse,
  NormalizedProviderError,
} from "../types"

export class GoogleGenAIAdapter implements ImageProvider {
  id = "google"
  name = "Google Gemini AI"

  getCapabilities(): ProviderCapabilities {
    return {
      supportedAspectRatios: ["16:9", "1:1", "9:16", "4:3"],
      supportedDimensions: [
        { width: 1280, height: 720 },
        { width: 1024, height: 1024 },
        { width: 720, height: 1280 },
      ],
      supportsSeed: true,
      supportsNegativePrompt: false,
      supportsAsync: false,
      supportsCancellation: false,
      rateLimitPerMinute: 60,
      maxConcurrency: 3,
    }
  }

  async generate(req: ProviderGenerateRequest): Promise<ProviderGenerateResponse> {
    const apiKey = req.apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY
    if (!apiKey) {
      return {
        ok: false,
        width: req.width,
        height: req.height,
        sizeBytes: 0,
        seed: req.seed,
        model: "gemini-2.5-flash",
        error: {
          code: "MISSING_API_KEY",
          message: "Google AI API Key is not configured.",
          status: 401,
          retryable: false,
        },
      }
    }

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: `Generate a high-resolution visual concept description and parameters for: ${req.prompt}` }],
            },
          ],
        }),
      })

      if (!res.ok) {
        return {
          ok: false,
          width: req.width,
          height: req.height,
          sizeBytes: 0,
          seed: req.seed,
          model: "gemini-2.5-flash",
          error: this.normalizeError({ status: res.status, statusText: res.statusText }),
        }
      }

      // If text generation succeeded, we can pipe to diffusion
      return {
        ok: false,
        width: req.width,
        height: req.height,
        sizeBytes: 0,
        seed: req.seed,
        model: "gemini-2.5-flash",
        error: {
          code: "MODALITY_NOT_SUPPORTED",
          message: "Native image modality pending on this Google key.",
          retryable: false,
        },
      }
    } catch (err: any) {
      return {
        ok: false,
        width: req.width,
        height: req.height,
        sizeBytes: 0,
        seed: req.seed,
        model: "gemini-2.5-flash",
        error: this.normalizeError(err),
      }
    }
  }

  normalizeError(error: any): NormalizedProviderError {
    const status = error?.status || 500
    if (status === 429) {
      return {
        code: "RATE_LIMITED",
        message: "Google AI rate limit reached.",
        status: 429,
        retryable: true,
        retryAfterSeconds: 4,
      }
    }
    if (status === 401 || status === 403) {
      return {
        code: "INVALID_KEY",
        message: "Invalid Google AI API key.",
        status,
        retryable: false,
      }
    }
    return {
      code: "PROVIDER_ERROR",
      message: error?.message || "Google AI provider error",
      status,
      retryable: status >= 500,
    }
  }
}
