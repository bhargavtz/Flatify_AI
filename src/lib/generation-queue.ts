import clientPromise from "@/lib/mongodb"
import { ObjectId, type Db } from "mongodb"
import type {
  GenerationBatch,
  GenerationTake,
  GenerationStatus,
  BatchDetailResponse,
} from "./generation-types"
import { CREATIVE_DIRECTIONS } from "./generation-types"
import { providerRegistry } from "./providers/registry"
import { uploadBufferToR2, getR2PublicUrl, isR2Configured } from "./r2"
import { saveMediaItem } from "./user-storage"
import { generateDiversifiedPrompt } from "./prompt-diversifier"
import crypto from "crypto"

const MAX_GLOBAL_CONCURRENCY = 8
const MAX_PER_USER_CONCURRENCY = 6
const MAX_PROVIDER_CONCURRENCY: Record<string, number> = {
  pollinations: 1, // Single-concurrency queue to prevent 429 rate-limiting
  google: 4,
  openai: 2,
}

// In-memory synchronized store for instant reads and resilience
const memBatches = new Map<string, GenerationBatch>()
const memTakes = new Map<string, GenerationTake>()

let activeGlobalJobs = 0
const activeUserJobs = new Map<string, number>()
const activeProviderJobs = new Map<string, number>()
let queueTimer: NodeJS.Timeout | null = null

async function getDb(): Promise<Db | null> {
  try {
    const client = await clientPromise
    return client.db()
  } catch (err) {
    console.warn("MongoDB handle warning in generation-queue:", err)
    return null
  }
}

/**
 * Creates a Generation Batch and independent takes in memory & MongoDB, then triggers background processing.
 */
export async function createGenerationBatch(input: {
  userId: string
  kind: "image" | "video"
  prompt: string
  aspectRatio?: string
  paper?: string
  motion?: string
  length?: string
  requestedModel?: string
  provider?: string
}): Promise<{ ok: boolean; batchId: string; batch: GenerationBatch; takes: GenerationTake[] }> {
  const db = await getDb()
  const now = new Date().toISOString()
  const batchId = new ObjectId().toString()

  const ratio = input.aspectRatio || "16:9"
  const getDimensions = (r: string) => {
    switch (r) {
      case "16:9":
        return { width: 1280, height: 720 }
      case "9:16":
        return { width: 720, height: 1280 }
      case "4:3":
        return { width: 1024, height: 768 }
      case "3:2":
        return { width: 1080, height: 720 }
      case "2:3":
        return { width: 720, height: 1080 }
      case "1:1":
      default:
        return { width: 1024, height: 1024 }
    }
  }
  const { width, height } = getDimensions(ratio)

  const takesCount = input.kind === "video" ? 1 : 4
  const batch: GenerationBatch = {
    _id: batchId,
    userId: input.userId,
    kind: input.kind,
    prompt: input.prompt,
    aspectRatio: ratio,
    paper: input.paper,
    motion: input.motion,
    length: input.length,
    requestedModel: input.requestedModel || (input.kind === "video" ? "turbo" : "turbo"),
    provider: input.provider || "pollinations",
    status: "queued",
    takesCount,
    completedTakes: 0,
    failedTakes: 0,
    createdAt: now,
    updatedAt: now,
  }

  const takes: GenerationTake[] = []

  if (input.kind === "video") {
    const attemptId = crypto.randomBytes(8).toString("hex")
    const { prompt: diversifiedPrompt, seed } = generateDiversifiedPrompt({
      basePrompt: input.prompt,
      takeNumber: 1,
      ratio,
      paper: input.paper,
      motion: input.motion,
      kind: "video",
    })
    const take: GenerationTake = {
      _id: new ObjectId().toString(),
      batchId,
      userId: input.userId,
      takeNumber: 1,
      creativeDirection: "Motion Clip",
      kicker: "01 MOTION",
      directionPrompt: diversifiedPrompt,
      status: "queued",
      statusMessage: "Queued for motion synthesis",
      provider: batch.provider,
      model: batch.requestedModel,
      generationAttemptId: attemptId,
      seed,
      width,
      height,
      retryCount: 0,
      maxRetries: 6,
      createdAt: now,
      updatedAt: now,
    }
    takes.push(take)
    memTakes.set(take._id, take)
  } else {
    // 4 Genuinely Distinct Creative Directions with Seed & Composition Diversification
    CREATIVE_DIRECTIONS.forEach((dir) => {
      const attemptId = crypto.randomBytes(8).toString("hex")
      const { prompt: diversifiedPrompt, seed } = generateDiversifiedPrompt({
        basePrompt: input.prompt,
        takeNumber: dir.number,
        ratio,
        paper: input.paper,
        kind: "image",
      })
      const take: GenerationTake = {
        _id: new ObjectId().toString(),
        batchId,
        userId: input.userId,
        takeNumber: dir.number,
        creativeDirection: dir.name,
        kicker: dir.kicker,
        directionPrompt: diversifiedPrompt,
        status: "queued",
        statusMessage: `Queued: ${dir.name}`,
        provider: batch.provider,
        model: batch.requestedModel,
        generationAttemptId: attemptId,
        seed,
        width,
        height,
        retryCount: 0,
        maxRetries: 6,
        createdAt: now,
        updatedAt: now,
      }
      takes.push(take)
      memTakes.set(take._id, take)
    })
  }

  // Store in memory
  memBatches.set(batchId, batch)

  // Store in MongoDB
  if (db) {
    try {
      await db.collection("generation_batches").insertOne(batch as any)
      await db.collection("generation_takes").insertMany(takes as any)
    } catch (err) {
      console.warn("MongoDB insert warning:", err)
    }
  }

  // Trigger non-blocking asynchronous queue processor
  triggerQueueProcessing()

  return { ok: true, batchId, batch, takes }
}

/**
 * Retrieves the batch and all individual take statuses
 */
export async function getBatchDetails(
  batchId: string,
  userId?: string | null
): Promise<BatchDetailResponse | null> {
  const memBatch = memBatches.get(batchId)
  let batch: GenerationBatch | null = memBatch || null
  let takes: GenerationTake[] = []

  const db = await getDb()
  if (db) {
    try {
      let dbBatch = (await db.collection("generation_batches").findOne({ _id: batchId as any })) as GenerationBatch | null
      if (!dbBatch && ObjectId.isValid(batchId)) {
        dbBatch = (await db.collection("generation_batches").findOne({ _id: new ObjectId(batchId) as any })) as GenerationBatch | null
      }
      if (dbBatch) {
        batch = dbBatch
        memBatches.set(batchId, dbBatch)
      }

      const dbTakes = (await db
        .collection("generation_takes")
        .find({ batchId })
        .sort({ takeNumber: 1 })
        .toArray()) as unknown as GenerationTake[]

      if (dbTakes && dbTakes.length > 0) {
        takes = dbTakes
        dbTakes.forEach((t) => memTakes.set(t._id, t))
      }
    } catch {
      /* ignore */
    }
  }

  if (!batch) {
    batch = memBatches.get(batchId) || null
  }

  if (takes.length === 0) {
    takes = Array.from(memTakes.values())
      .filter((t) => t.batchId === batchId)
      .sort((a, b) => a.takeNumber - b.takeNumber)
  }

  if (!batch) return null

  // Authorization check
  if (userId && userId !== "guest_preview" && batch.userId !== userId && batch.userId !== "guest_preview") {
    return null
  }

  const finishedCount = takes.filter(
    (t) => t.status === "completed" || t.status === "failed" || t.status === "cancelled" || t.status === "provider_unavailable"
  ).length
  const isFinished = takes.length > 0 && finishedCount === takes.length

  return {
    ok: true,
    batch,
    takes,
    isFinished,
  }
}

/**
 * Cancels queued and processing takes in a batch
 */
export async function cancelBatch(batchId: string): Promise<boolean> {
  const batch = memBatches.get(batchId)
  const now = new Date().toISOString()

  if (batch) {
    batch.status = "cancelled"
    batch.updatedAt = now
    batch.completedAt = now
  }

  for (const take of memTakes.values()) {
    if (take.batchId === batchId && (take.status === "queued" || take.status === "processing" || take.status === "retrying")) {
      take.status = "cancelled"
      take.statusMessage = "Cancelled by user"
      take.updatedAt = now
      take.completedAt = now
    }
  }

  const db = await getDb()
  if (db) {
    try {
      await db.collection("generation_batches").updateOne(
        { _id: batchId as any },
        { $set: { status: "cancelled", updatedAt: now, completedAt: now } }
      )

      await db.collection("generation_takes").updateMany(
        { batchId, status: { $in: ["queued", "retrying", "processing"] } },
        {
          $set: {
            status: "cancelled",
            statusMessage: "Cancelled by user",
            updatedAt: now,
            completedAt: now,
          },
        }
      )
    } catch {
      /* ignore */
    }
  }

  return true
}

/**
 * Initiates or signals the queue worker loop
 */
export function triggerQueueProcessing() {
  if (queueTimer) return
  queueTimer = setTimeout(async () => {
    queueTimer = null
    await processNextQueueItems()
  }, 50)
}

/**
 * Core asynchronous generation worker loop
 */
async function processNextQueueItems() {
  const now = new Date().toISOString()

  // Dynamically sync concurrency metrics with active processing takes to prevent deadlock
  const processingTakes = Array.from(memTakes.values()).filter((t) => t.status === "processing")
  activeGlobalJobs = processingTakes.length
  activeUserJobs.clear()
  activeProviderJobs.clear()
  processingTakes.forEach((t) => {
    activeUserJobs.set(t.userId, (activeUserJobs.get(t.userId) || 0) + 1)
    activeProviderJobs.set(t.provider, (activeProviderJobs.get(t.provider) || 0) + 1)
  })

  if (activeGlobalJobs >= MAX_GLOBAL_CONCURRENCY) {
    return
  }

  // Collect candidate takes from memory first
  const memCandidates = Array.from(memTakes.values()).filter(
    (t) => t.status === "queued" || (t.status === "retrying" && t.nextRetryAt && t.nextRetryAt <= now)
  )

  for (const take of memCandidates) {
    if (take.userId !== "guest_preview") {
      const userActive = activeUserJobs.get(take.userId) || 0
      if (userActive >= MAX_PER_USER_CONCURRENCY) continue
    }

    const providerLimit = MAX_PROVIDER_CONCURRENCY[take.provider] || 2
    const providerActive = activeProviderJobs.get(take.provider) || 0
    if (providerActive >= providerLimit) continue

    // Acquire concurrency slots
    activeGlobalJobs++
    activeUserJobs.set(take.userId, (activeUserJobs.get(take.userId) || 0) + 1)
    activeProviderJobs.set(take.provider, providerActive + 1)

    // Execute take in background worker
    void executeTakeWorker(take)

    if (activeGlobalJobs >= MAX_GLOBAL_CONCURRENCY) break
  }

  // Check for any pending retries and schedule next execution check
  const futureRetries = Array.from(memTakes.values()).filter(
    (t) => t.status === "retrying" && t.nextRetryAt && t.nextRetryAt > now
  )
  if (futureRetries.length > 0 && !queueTimer) {
    const minDelay = Math.min(
      ...futureRetries.map((t) => Math.max(200, new Date(t.nextRetryAt!).getTime() - Date.now()))
    )
    queueTimer = setTimeout(() => {
      queueTimer = null
      void processNextQueueItems()
    }, minDelay + 100)
  }
}

async function executeTakeWorker(take: GenerationTake) {
  const db = await getDb()
  const providerId = take.provider
  const userId = take.userId

  try {
    // Update status to processing
    const processingNow = new Date().toISOString()
    take.status = "processing"
    take.statusMessage = `Generating ${take.creativeDirection}...`
    take.updatedAt = processingNow

    const batch = memBatches.get(take.batchId)
    if (batch && batch.status === "queued") {
      batch.status = "processing"
      batch.updatedAt = processingNow
    }

    if (db) {
      await db.collection("generation_takes").updateOne(
        { _id: take._id as any },
        {
          $set: {
            status: "processing",
            statusMessage: `Generating ${take.creativeDirection}...`,
            updatedAt: processingNow,
          },
        }
      ).catch(() => null)
    }

    // Resolve provider & execute
    const { provider, plainApiKey } = await providerRegistry.resolveForUser(take.userId, take.provider)
    const res = await provider.generate({
      prompt: take.directionPrompt,
      aspectRatio: `${take.width}:${take.height}`,
      width: take.width,
      height: take.height,
      seed: take.seed,
      model: take.model,
      attemptId: take.generationAttemptId,
      apiKey: plainApiKey,
    })

    if (res.ok && res.buffer && res.buffer.byteLength > 0) {
      // 1. Upload validated binary asset to Cloudflare R2
      const isVideo = batch?.kind === "video" || res.mimeType?.includes("video") || res.mimeType?.includes("mp4")
      const mimeType = res.mimeType || (isVideo ? "video/mp4" : "image/jpeg")
      const ext = isVideo
        ? (mimeType.includes("webm") ? "webm" : "mp4")
        : mimeType.includes("png") ? "png" : mimeType.includes("webp") ? "webp" : "jpg"
      const fileKey = `media/${userId}/${take.batchId}/${take.takeNumber}-${take.generationAttemptId}.${ext}`
      const nodeBuffer = Buffer.from(res.buffer)

      let assetUrl = ""
      if (isR2Configured()) {
        const r2Res = await uploadBufferToR2(nodeBuffer, fileKey, mimeType)
        assetUrl = r2Res ? r2Res.url : getR2PublicUrl(fileKey)
      } else {
        // Safe base64 binary URI if R2 credentials are not set in environment
        assetUrl = `data:${mimeType};base64,${nodeBuffer.toString("base64")}`
      }

      // 2. Persist media item in library
      let mediaId: string | null = null
      if (userId) {
        try {
          const res = await saveMediaItem({
            clerkId: userId,
            key: fileKey,
            url: assetUrl,
            kind: batch?.kind === "video" ? "video" : "image",
            prompt: take.directionPrompt,
            tagline: take.creativeDirection,
            ratio: `${take.width}:${take.height}`,
            style: { paper: batch?.paper, motion: batch?.motion, length: batch?.length },
            sizeBytes: nodeBuffer.length,
          })
          if (res?.media) mediaId = res.media._id
        } catch (mediaErr) {
          console.warn("Could not save media item record:", mediaErr)
        }
      }

      // 3. Mark Take Completed in memory and DB
      const completedNow = new Date().toISOString()
      take.status = "completed"
      take.statusMessage = "Ready"
      take.url = assetUrl
      take.r2Key = fileKey
      take.mimeType = mimeType
      take.sizeBytes = nodeBuffer.length
      take.mediaId = mediaId
      take.updatedAt = completedNow
      take.completedAt = completedNow

      if (batch) {
        batch.completedTakes = (batch.completedTakes || 0) + 1
        batch.updatedAt = completedNow
        if (batch.completedTakes + (batch.failedTakes || 0) >= batch.takesCount) {
          batch.status = "completed"
          batch.completedAt = completedNow
        }
      }

      if (db) {
        await db.collection("generation_takes").updateOne(
          { _id: take._id as any },
          {
            $set: {
              status: "completed",
              statusMessage: "Ready",
              url: assetUrl,
              r2Key: fileKey,
              mimeType,
              sizeBytes: nodeBuffer.length,
              mediaId,
              updatedAt: completedNow,
              completedAt: completedNow,
            },
          }
        ).catch(() => null)

        await db.collection("generation_batches").updateOne(
          { _id: take.batchId as any },
          {
            $inc: { completedTakes: 1 },
            $set: { updatedAt: completedNow },
          }
        ).catch(() => null)
      }
    } else {
      // Handle provider error & retry logic
      const err = res.error || { code: "GENERIC_ERROR", message: "Generation failed", retryable: false }
      const newRetryCount = (take.retryCount || 0) + 1

      if (err.retryable && newRetryCount <= (take.maxRetries || 3)) {
        // Exponential backoff with random jitter
        const baseSeconds = err.retryAfterSeconds || Math.pow(1.4, newRetryCount) * 1.0
        const jitterSeconds = Math.random() * 0.4
        const delaySeconds = Math.min(baseSeconds + jitterSeconds, 5)
        const nextRetry = new Date(Date.now() + delaySeconds * 1000).toISOString()

        take.status = "retrying"
        take.statusMessage =
          err.code === "RATE_LIMITED"
            ? `Synthesizing in next queue slot (${Math.round(delaySeconds)}s)…`
            : `Retrying in ${Math.round(delaySeconds)}s: ${err.message}`
        take.retryCount = newRetryCount
        take.nextRetryAt = nextRetry
        take.errorCode = err.code
        take.errorMessage = err.message
        take.updatedAt = new Date().toISOString()

        // Wake queue processing after the delay
        setTimeout(() => triggerQueueProcessing(), delaySeconds * 1000 + 100)

        if (db) {
          await db.collection("generation_takes").updateOne(
            { _id: take._id as any },
            {
              $set: {
                status: "retrying",
                statusMessage: `Retrying in ${Math.round(delaySeconds)}s: ${err.message}`,
                retryCount: newRetryCount,
                nextRetryAt: nextRetry,
                errorCode: err.code,
                errorMessage: err.message,
                updatedAt: new Date().toISOString(),
              },
            }
          ).catch(() => null)
        }
      } else {
        // Permanent failure for this take
        const failedNow = new Date().toISOString()
        const finalStatus: GenerationStatus = err.code === "PROVIDER_TIMEOUT_OR_DOWN" ? "provider_unavailable" : "failed"
        take.status = finalStatus
        take.statusMessage = err.message || "Generation failed"
        take.errorCode = err.code
        take.errorMessage = err.message
        take.updatedAt = failedNow
        take.completedAt = failedNow

        if (batch) {
          batch.failedTakes = (batch.failedTakes || 0) + 1
          batch.updatedAt = failedNow
          if ((batch.completedTakes || 0) + batch.failedTakes >= batch.takesCount) {
            batch.status = (batch.completedTakes || 0) > 0 ? "completed" : "failed"
            batch.completedAt = failedNow
          }
        }

        if (db) {
          await db.collection("generation_takes").updateOne(
            { _id: take._id as any },
            {
              $set: {
                status: finalStatus,
                statusMessage: err.message || "Generation failed",
                errorCode: err.code,
                errorMessage: err.message,
                updatedAt: failedNow,
                completedAt: failedNow,
              },
            }
          ).catch(() => null)

          await db.collection("generation_batches").updateOne(
            { _id: take.batchId as any },
            {
              $inc: { failedTakes: 1 },
              $set: { updatedAt: failedNow },
            }
          ).catch(() => null)
        }
      }
    }
  } catch (err: any) {
    console.error("Critical worker error on take:", take._id, err)
    take.status = "failed"
    take.statusMessage = err?.message || "Execution exception"
    take.errorCode = "WORKER_EXCEPTION"
    take.errorMessage = err?.message
    take.updatedAt = new Date().toISOString()
    take.completedAt = new Date().toISOString()
  } finally {
    // Release concurrency slots
    activeGlobalJobs = Math.max(0, activeGlobalJobs - 1)
    const userActive = activeUserJobs.get(userId) || 1
    activeUserJobs.set(userId, Math.max(0, userActive - 1))
    const providerActive = activeProviderJobs.get(providerId) || 1
    activeProviderJobs.set(providerId, Math.max(0, providerActive - 1))

    // Schedule next cycle
    triggerQueueProcessing()
  }
}
