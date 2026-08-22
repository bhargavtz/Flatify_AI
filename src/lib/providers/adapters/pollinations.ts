import type {
  ImageProvider,
  ProviderCapabilities,
  ProviderGenerateRequest,
  ProviderGenerateResponse,
  NormalizedProviderError,
} from "../types"

let lastPollinationsCallTimestamp = 0

export class PollinationsAdapter implements ImageProvider {
  id = "pollinations"
  name = "FLUX.1 Diffusion Engine"

  getCapabilities(): ProviderCapabilities {
    return {
      supportedAspectRatios: ["16:9", "1:1", "9:16", "4:3", "3:2", "2:3"],
      supportedDimensions: [
        { width: 1280, height: 720 },
        { width: 1024, height: 1024 },
        { width: 720, height: 1280 },
        { width: 1024, height: 768 },
        { width: 1080, height: 720 },
        { width: 720, height: 1080 },
      ],
      supportsSeed: true,
      supportsNegativePrompt: true,
      supportsAsync: false,
      supportsCancellation: false,
      rateLimitPerMinute: 20,
      maxConcurrency: 1, // Single-concurrency queue to prevent 429
    }
  }

  async generate(req: ProviderGenerateRequest): Promise<ProviderGenerateResponse> {
    // Enforce 2.4s spacing between consecutive requests from the same server IP to prevent 429
    const now = Date.now()
    const elapsed = now - lastPollinationsCallTimestamp
    if (elapsed < 2400) {
      await new Promise((r) => setTimeout(r, 2400 - elapsed))
    }
    lastPollinationsCallTimestamp = Date.now()

    // Multi-tier model fallback: Try FLUX first, then Turbo
    const preferredModel = req.model || "flux"
    const modelCandidates = preferredModel === "flux" ? ["flux", "turbo"] : ["turbo", "flux"]

    let lastError: NormalizedProviderError | undefined

    for (const model of modelCandidates) {
      for (let attempt = 0; attempt < 2; attempt++) {
        if (attempt > 0) {
          // Wait before second attempt on same model
          await new Promise((r) => setTimeout(r, 3000))
          lastPollinationsCallTimestamp = Date.now()
        }

        const response = await this.executeFetch(req, model)
        if (response.ok) {
          return response
        }

        lastError = response.error
        if (!response.error?.retryable) {
          // Non-retryable error (e.g. 400 bad prompt)
          return response
        }
      }
    }

    return {
      ok: false,
      width: req.width,
      height: req.height,
      sizeBytes: 0,
      seed: req.seed,
      model: preferredModel,
      error: lastError || {
        code: "RATE_LIMITED",
        message: "Diffusion queue busy, retrying next slot.",
        retryable: true,
        retryAfterSeconds: 3,
      },
    }
  }

  private async executeFetch(
    req: ProviderGenerateRequest,
    model: string
  ): Promise<ProviderGenerateResponse> {
    // Keep prompt crisp and clean for optimum URL query tolerance
    const cleanPrompt = req.prompt.length > 320 ? req.prompt.slice(0, 320) : req.prompt
    const encodedPrompt = encodeURIComponent(cleanPrompt)
    const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${req.width}&height=${req.height}&model=${model}&seed=${req.seed}&nologo=true`

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 45000)

    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) FlatifyAI/2.0",
          Accept: "image/avif,image/webp,image/apng,image/jpeg,image/png,*/*;q=0.8",
        },
      })

      clearTimeout(timer)

      if (!res.ok) {
        let retryAfter: number | undefined
        const retryHeader = res.headers.get("retry-after")
        if (retryHeader) {
          const parsed = parseInt(retryHeader, 10)
          if (!isNaN(parsed)) retryAfter = parsed
        }

        const error = this.normalizeError({
          status: res.status,
          statusText: res.statusText,
          retryAfter,
        })
        return {
          ok: false,
          width: req.width,
          height: req.height,
          sizeBytes: 0,
          seed: req.seed,
          model,
          error,
        }
      }

      const contentType = res.headers.get("content-type") || "image/jpeg"
      if (contentType.includes("application/json") || contentType.includes("text/html")) {
        return {
          ok: false,
          width: req.width,
          height: req.height,
          sizeBytes: 0,
          seed: req.seed,
          model,
          error: {
            code: "INVALID_MIME_TYPE",
            message: "Provider returned non-image content",
            status: res.status,
            retryable: true,
            retryAfterSeconds: 3,
          },
        }
      }

      const buffer = await res.arrayBuffer()
      if (!this.isValidBitmap(buffer)) {
        return {
          ok: false,
          width: req.width,
          height: req.height,
          sizeBytes: buffer.byteLength,
          seed: req.seed,
          model,
          error: {
            code: "CORRUPTED_IMAGE_BYTES",
            message: "Image buffer failed binary bitmap validation",
            retryable: true,
            retryAfterSeconds: 3,
          },
        }
      }

      return {
        ok: true,
        buffer,
        mimeType: contentType,
        width: req.width,
        height: req.height,
        sizeBytes: buffer.byteLength,
        seed: req.seed,
        model,
      }
    } catch (err: any) {
      clearTimeout(timer)
      return {
        ok: false,
        width: req.width,
        height: req.height,
        sizeBytes: 0,
        seed: req.seed,
        model,
        error: this.normalizeError(err),
      }
    }
  }

  normalizeError(error: any): NormalizedProviderError {
    const status = error?.status || (error?.name === "AbortError" ? 504 : 500)
    const msg = error?.message || error?.statusText || "Diffusion generation failed"

    if (status === 429) {
      return {
        code: "RATE_LIMITED",
        message: "Queue busy, awaiting next clearance slot.",
        status: 429,
        retryable: true,
        retryAfterSeconds: error?.retryAfter || 3,
      }
    }

    if (status >= 500 || status === 504 || error?.name === "AbortError") {
      return {
        code: "PROVIDER_TIMEOUT_OR_DOWN",
        message: "Diffusion server timed out or is temporarily unavailable.",
        status,
        retryable: true,
        retryAfterSeconds: 3,
      }
    }

    if (status === 400) {
      return {
        code: "INVALID_PROMPT_REQUEST",
        message: "Prompt or parameters rejected by provider.",
        status: 400,
        retryable: false,
      }
    }

    if (status === 401 || status === 403) {
      return {
        code: "AUTH_FORBIDDEN",
        message: "Provider access forbidden.",
        status,
        retryable: false,
      }
    }

    return {
      code: "NETWORK_ERROR",
      message: msg,
      status,
      retryable: true,
      retryAfterSeconds: 3,
    }
  }

  private isValidBitmap(buffer: ArrayBuffer): boolean {
    if (!buffer || buffer.byteLength < 500) return false
    const bytes = new Uint8Array(buffer.slice(0, 8))

    // JPEG signature: FF D8 FF
    const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
    // PNG signature: 89 50 4E 47
    const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
    // WebP signature: 52 49 46 46 (RIFF)
    const isWebp = bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46

    return isJpeg || isPng || isWebp
  }
}
