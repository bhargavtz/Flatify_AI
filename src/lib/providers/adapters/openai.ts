import type {
  ImageProvider,
  ProviderCapabilities,
  ProviderGenerateRequest,
  ProviderGenerateResponse,
  NormalizedProviderError,
} from "../types"

export class OpenAIAdapter implements ImageProvider {
  id = "openai"
  name = "OpenAI (DALL-E 3)"

  getCapabilities(): ProviderCapabilities {
    return {
      supportedAspectRatios: ["1:1", "16:9", "9:16"],
      supportedDimensions: [
        { width: 1024, height: 1024 },
        { width: 1792, height: 1024 },
        { width: 1024, height: 1792 },
      ],
      supportsSeed: false,
      supportsNegativePrompt: false,
      supportsAsync: false,
      supportsCancellation: false,
      rateLimitPerMinute: 15,
      maxConcurrency: 2,
    }
  }

  async generate(req: ProviderGenerateRequest): Promise<ProviderGenerateResponse> {
    if (!req.apiKey) {
      return {
        ok: false,
        width: req.width,
        height: req.height,
        sizeBytes: 0,
        seed: req.seed,
        model: "dall-e-3",
        error: {
          code: "MISSING_API_KEY",
          message: "OpenAI API Key required for this provider.",
          status: 401,
          retryable: false,
        },
      }
    }

    try {
      const size = req.aspectRatio === "16:9" ? "1792x1024" : req.aspectRatio === "9:16" ? "1024x1792" : "1024x1024"
      const res = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${req.apiKey}`,
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: req.prompt,
          n: 1,
          size,
          response_format: "b64_json",
        }),
      })

      if (!res.ok) {
        return {
          ok: false,
          width: req.width,
          height: req.height,
          sizeBytes: 0,
          seed: req.seed,
          model: "dall-e-3",
          error: this.normalizeError({ status: res.status, statusText: res.statusText }),
        }
      }

      const json = await res.json()
      const b64 = json.data?.[0]?.b64_json
      if (!b64) {
        return {
          ok: false,
          width: req.width,
          height: req.height,
          sizeBytes: 0,
          seed: req.seed,
          model: "dall-e-3",
          error: {
            code: "EMPTY_RESPONSE",
            message: "OpenAI returned empty image data.",
            retryable: false,
          },
        }
      }

      const buffer = Buffer.from(b64, "base64").buffer
      return {
        ok: true,
        buffer,
        mimeType: "image/png",
        width: req.width,
        height: req.height,
        sizeBytes: buffer.byteLength,
        seed: req.seed,
        model: "dall-e-3",
      }
    } catch (err: any) {
      return {
        ok: false,
        width: req.width,
        height: req.height,
        sizeBytes: 0,
        seed: req.seed,
        model: "dall-e-3",
        error: this.normalizeError(err),
      }
    }
  }

  normalizeError(error: any): NormalizedProviderError {
    const status = error?.status || 500
    if (status === 429) {
      return {
        code: "RATE_LIMITED",
        message: "OpenAI rate limit or quota exceeded.",
        status: 429,
        retryable: true,
        retryAfterSeconds: 5,
      }
    }
    if (status === 401) {
      return {
        code: "INVALID_KEY",
        message: "Invalid OpenAI API Key.",
        status: 401,
        retryable: false,
      }
    }
    return {
      code: "OPENAI_ERROR",
      message: error?.message || "OpenAI generation failed.",
      status,
      retryable: status >= 500,
    }
  }
}
