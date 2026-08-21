import type { ImageProvider } from "./types"
import { PollinationsAdapter } from "./adapters/pollinations"
import { GoogleGenAIAdapter } from "./adapters/google"
import { OpenAIAdapter } from "./adapters/openai"
import { getActiveUserKey } from "@/lib/settings"

class ProviderRegistry {
  private providers = new Map<string, ImageProvider>()

  constructor() {
    this.register(new PollinationsAdapter())
    this.register(new GoogleGenAIAdapter())
    this.register(new OpenAIAdapter())
  }

  register(provider: ImageProvider) {
    this.providers.set(provider.id, provider)
  }

  get(id: string): ImageProvider {
    return this.providers.get(id) || this.providers.get("pollinations")!
  }

  async resolveForUser(
    userId?: string | null,
    requestedProvider?: string
  ): Promise<{ provider: ImageProvider; plainApiKey?: string }> {
    if (requestedProvider && requestedProvider !== "flatify-neural" && requestedProvider !== "flatify-free") {
      const explicit = this.providers.get(requestedProvider)
      if (explicit) return { provider: explicit }
    }

    if (userId && userId !== "guest_preview") {
      try {
        const ownKey = await getActiveUserKey(userId, ["openai", "google", "openrouter"])
        if (ownKey && ownKey.plain) {
          const matched = this.providers.get(ownKey.provider)
          if (matched) {
            return {
              provider: matched,
              plainApiKey: ownKey.plain,
            }
          }
        }
      } catch {
        /* proceed to default provider */
      }
    }

    // Default high-performance diffusion provider
    return {
      provider: this.get("pollinations"),
    }
  }
}

export const providerRegistry = new ProviderRegistry()
