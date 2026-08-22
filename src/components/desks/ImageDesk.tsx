"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  RefreshCw,
  Download,
  Maximize2,
  Clapperboard,
  Check,
  X,
  Sparkles,
  Ban,
  AlertCircle,
  Clock,
  RotateCw,
  Lock,
} from "lucide-react"
import PublishPanel from "@/components/explore/PublishPanel"
import type { GenerationTake, BatchDetailResponse } from "@/lib/generation-types"

const RATIOS = ["1:1", "16:9", "4:3", "9:16"] as const

const IMAGE_MODELS = [
  { id: "flux", name: "FLUX.1 Flagship", desc: "100/100 Photorealism & Microtextures" },
  { id: "turbo", name: "SDXL Turbo", desc: "Real-time Ultra-Fast Generation" },
  { id: "imagen-3", name: "Google Imagen 3", desc: "Google DeepMind Visual Foundation" },
  { id: "dall-e-3", name: "DALL-E 3", desc: "OpenAI Creative Fidelity" },
  { id: "midjourney", name: "Midjourney Style", desc: "Cinematic Drama & Contrast" },
]

const PAPERS = [
  { id: "held", label: "Held light", desc: "Warm ambient studio illumination" },
  { id: "night", label: "Night street", desc: "Moody sodium lamps & deep contrast" },
  { id: "studio", label: "Studio pack", desc: "Clean commercial editorial lighting" },
  { id: "film", label: "Print grain", desc: "Analog 35mm textured grain" },
]

const DEFAULT_TAKE_CARDS = [
  { takeNumber: 1, kicker: "01 MASTER", name: "Hero / Master Shot", desc: "Primary balanced hero perspective" },
  { takeNumber: 2, kicker: "02 CINEMATIC", name: "Cinematic / 35mm", desc: "Wide atmospheric anamorphic angle" },
  { takeNumber: 3, kicker: "03 DYNAMIC", name: "Dynamic / Studio", desc: "High contrast commercial lighting" },
  { takeNumber: 4, kicker: "04 EDITORIAL", name: "Editorial / Minimal", desc: "Negative space & aesthetic framing" },
]

export default function ImageDesk() {
  const [prompt, setPrompt] = useState(() => {
    if (typeof window === "undefined") return "A wet street at dusk, sodium lamps, one figure in a cobalt coat"
    return new URLSearchParams(window.location.search).get("prompt") || "A wet street at dusk, sodium lamps, one figure in a cobalt coat"
  })
  const [model, setModel] = useState("flux")
  const [ratio, setRatio] = useState<(typeof RATIOS)[number]>("16:9")
  const [paper, setPaper] = useState("held")

  const [activeBatchId, setActiveBatchId] = useState<string | null>(null)
  const [takes, setTakes] = useState<GenerationTake[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState("")

  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()

  // Polling function for active batch
  const pollBatchStatus = useCallback(async (batchId: string) => {
    try {
      const res = await fetch(`/api/generations/${batchId}`)
      if (!res.ok) {
        if (res.status === 404) {
          localStorage.removeItem("flatify_active_batch")
          setActiveBatchId(null)
          setIsGenerating(false)
        }
        return
      }

      const data = (await res.json()) as BatchDetailResponse
      if (data.ok && data.takes) {
        setTakes(data.takes)
        if (data.isFinished) {
          setIsGenerating(false)
          localStorage.removeItem("flatify_active_batch")
          if (pollingRef.current) clearInterval(pollingRef.current)
        }
      }
    } catch (err) {
      console.warn("Batch polling tick failed:", err)
    }
  }, [])

  // Restore active batch on initial mount / page reload
  useEffect(() => {
    const savedBatchId = localStorage.getItem("flatify_active_batch")
    if (savedBatchId) {
      queueMicrotask(() => {
        setActiveBatchId(savedBatchId)
        setIsGenerating(true)
        void pollBatchStatus(savedBatchId)
      })
    }
  }, [pollBatchStatus])

  // Polling interval manager
  useEffect(() => {
    if (isGenerating && activeBatchId) {
      if (pollingRef.current) clearInterval(pollingRef.current)
      pollingRef.current = setInterval(() => {
        void pollBatchStatus(activeBatchId)
      }, 1200)
    } else {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [isGenerating, activeBatchId, pollBatchStatus])

  // Start new generation batch
  const handleGenerate = async () => {
    if (isGenerating) return
    setIsGenerating(true)
    setErrorMessage("")

    try {
      const res = await fetch("/api/generations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "image",
          prompt,
          ratio,
          paper,
          requestedModel: model,
        }),
      })

      const json = await res.json()
      if (!res.ok || !json.ok) {
        setErrorMessage(json.error || "Failed to initialize generation.")
        setIsGenerating(false)
        return
      }

      const batchId = json.batchId
      setActiveBatchId(batchId)
      localStorage.setItem("flatify_active_batch", batchId)

      if (json.takes) {
        setTakes(json.takes)
      }
      setSelectedIndex(0)
    } catch {
      setErrorMessage("Network error: Could not reach generation server.")
      setIsGenerating(false)
    }
  }

  // Cancel generation in progress
  const handleCancel = async () => {
    if (!activeBatchId) return
    try {
      await fetch(`/api/generations/${activeBatchId}/cancel`, { method: "POST" })
      localStorage.removeItem("flatify_active_batch")
      setIsGenerating(false)
      void pollBatchStatus(activeBatchId)
    } catch {
      /* ignore */
    }
  }

  const downloadImage = (url: string, index: number) => {
    const link = document.createElement("a")
    link.href = url
    link.download = `flatify_take_0${index + 1}.jpg`
    link.target = "_blank"
    link.rel = "noreferrer"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const sendToVideo = (selectedUrl?: string) => {
    router.push(`/video?prompt=${encodeURIComponent(prompt)}&ratio=${ratio}&ref=${encodeURIComponent(selectedUrl || "")}`)
  }

  const completedTakesCount = takes.filter((t) => t.status === "completed").length
  const selectedTake = takes[selectedIndex]

  return (
    <div className="page-max page-pad grid min-w-0 gap-8 pt-[calc(var(--header-offset)+2rem)] lg:grid-cols-[minmax(0,22rem)_1fr] lg:gap-12 lg:pt-[calc(var(--header-offset)+3rem)]">
      {/* Controls Column */}
      <div className="order-2 min-w-0 lg:order-1">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-saffron">AI Image Studio</p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-chalk text-balance md:text-5xl">
          Draw a still.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-mist">
          Generates 4 genuine AI diffusion takes concurrently with composition diversity and real-time state tracking.
        </p>

        <div className="mt-8 flex items-center justify-between">
          <label htmlFor="image-brief" className="block font-mono text-[11px] uppercase tracking-[0.16em] text-mist">
            Prompt Brief
          </label>
          {isGenerating && (
            <span className="inline-flex items-center gap-1 font-mono text-[10px] text-saffron bg-saffron/10 px-2 py-0.5 rounded border border-saffron/30">
              <Lock className="w-3 h-3" />
              Layout Locked
            </span>
          )}
        </div>
        <textarea
          id="image-brief"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={isGenerating}
          rows={4}
          spellCheck={false}
          autoComplete="off"
          placeholder="A wet street at dusk, sodium lamps, one figure in a cobalt coat…"
          className={`mt-2 w-full resize-none rounded-md border border-chalk/15 bg-slateink p-4 text-sm text-chalk placeholder:text-mist/50 focus:border-cobalt focus:outline-none transition-opacity ${
            isGenerating ? "opacity-60 cursor-not-allowed" : ""
          }`}
        />

        <div className="mt-6 flex items-center justify-between">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-mist flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cobalt" />
            AI Image Model
          </p>
        </div>
        <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
          {IMAGE_MODELS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setModel(m.id)}
              disabled={isGenerating}
              className={`btn-press touch rounded-md p-2.5 text-left transition-all ${
                isGenerating ? "cursor-not-allowed opacity-60" : ""
              } ${
                model === m.id
                  ? "border border-cobalt bg-cobalt/20 text-chalk"
                  : "border border-chalk/15 text-mist hover:text-chalk"
              }`}
            >
              <p className="text-xs font-semibold text-chalk">{m.name}</p>
              <p className="text-[10px] text-mist/70 mt-0.5 line-clamp-1">{m.desc}</p>
            </button>
          ))}
        </div>

        <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.16em] text-mist">Aspect Ratio / Layout</p>
        <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Aspect ratio">
          {RATIOS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRatio(r)}
              disabled={isGenerating}
              className={`btn-press touch rounded-md px-4 py-2 font-mono text-xs tabular-nums transition-all ${
                isGenerating ? "cursor-not-allowed opacity-60" : ""
              } ${
                ratio === r ? "bg-chalk text-ink font-semibold" : "border border-chalk/15 text-mist hover:text-chalk"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.16em] text-mist">Lighting & Texture Pack</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {PAPERS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPaper(p.id)}
              disabled={isGenerating}
              className={`btn-press touch rounded-md p-3 text-left transition-all ${
                isGenerating ? "cursor-not-allowed opacity-60" : ""
              } ${
                paper === p.id ? "border border-cobalt bg-cobalt/20 text-chalk" : "border border-chalk/15 text-mist hover:text-chalk"
              }`}
            >
              <p className="text-sm font-semibold text-chalk">{p.label}</p>
              <p className="text-[11px] text-mist/70 mt-0.5">{p.desc}</p>
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex gap-3 lg:sticky lg:bottom-6">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="btn-press flex flex-1 touch items-center justify-center gap-2 rounded-md bg-cobalt px-6 py-3.5 text-sm font-semibold text-chalk hover:bg-[#4A70FF] disabled:opacity-70 shadow-lg shadow-cobalt/20"
          >
            {isGenerating ? <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Sparkles className="h-4 w-4" />}
            {isGenerating ? "Synthesizing 4 Takes…" : "Generate 4 Takes"}
          </button>

          {isGenerating && (
            <button
              type="button"
              onClick={handleCancel}
              className="btn-press flex items-center justify-center gap-1.5 rounded-md border border-rose-500/30 bg-rose-500/10 px-4 py-3.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20"
              title="Cancel Generation"
            >
              <Ban className="h-4 w-4" />
              <span>Cancel</span>
            </button>
          )}
        </div>

        {errorMessage && (
          <div className="mt-3 flex items-center gap-2 rounded-md border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {completedTakesCount > 0 && selectedTake?.url ? (
          <PublishPanel kind="image" prompt={prompt} ratio={ratio} paper={paper} />
        ) : null}
      </div>

      {/* 4-Take Image Gallery Column */}
      <div className="order-1 min-w-0 lg:order-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <p className="font-mono text-xs uppercase tracking-wider text-mist">
              {takes.length > 0 ? "4 Creative Diffusion Takes" : "Studio Canvas (4 Takes)"}
            </p>
            {isGenerating && (
              <span className="inline-flex items-center gap-1 rounded-full bg-cobalt/20 px-2 py-0.5 font-mono text-[10px] text-cobalt font-semibold animate-pulse">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Live Job Active
              </span>
            )}
          </div>
          {completedTakesCount > 0 && (
            <span className="font-mono text-xs text-saffron">
              Completed: {completedTakesCount}/4 · Selected: Take 0{selectedIndex + 1}
            </span>
          )}
        </div>

        <div
          className={`grid gap-4 ${ratio === "9:16" ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-1 sm:grid-cols-2"}`}
        >
          {[0, 1, 2, 3].map((i) => {
            const take = takes[i]
            const defaultCard = DEFAULT_TAKE_CARDS[i]
            const isCompleted = take?.status === "completed" && Boolean(take.url)
            const isProcessing = take?.status === "processing"
            const isRetrying = take?.status === "retrying"
            const isQueued = take?.status === "queued"
            const isFailed = take?.status === "failed" || take?.status === "provider_unavailable"
            const isCancelled = take?.status === "cancelled"
            const isSelected = selectedIndex === i

            return (
              <div
                key={take?._id || `default-card-${i}`}
                onClick={() => isCompleted && setSelectedIndex(i)}
                className={`group relative overflow-hidden rounded-xl border transition-all duration-300 ${
                  ratio === "1:1"
                    ? "aspect-square"
                    : ratio === "9:16"
                    ? "aspect-[9/16]"
                    : ratio === "4:3"
                    ? "aspect-[4/3]"
                    : "aspect-video"
                } ${
                  isSelected && isCompleted
                    ? "border-cobalt ring-2 ring-cobalt/50 shadow-2xl scale-[1.01]"
                    : isCompleted
                    ? "border-chalk/15 hover:border-chalk/40 bg-slateink cursor-pointer"
                    : isProcessing
                    ? "border-cobalt/60 bg-cobalt/5 ring-1 ring-cobalt/20"
                    : isRetrying
                    ? "border-amber-500/40 bg-amber-500/5"
                    : isFailed
                    ? "border-rose-500/30 bg-rose-500/5"
                    : "border-chalk/10 bg-slateink"
                }`}
              >
                {/* 1. COMPLETED: Real Bitmap Diffusion Output */}
                {isCompleted && take.url ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={take.url}
                      alt={take.creativeDirection || `Take 0${i + 1}`}
                      className="h-full w-full object-cover transition-all duration-500 group-hover:scale-105"
                      loading="eager"
                    />

                    {/* Take Tag Badge */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-md bg-ink/80 px-2 py-1 backdrop-blur font-mono text-[10px] uppercase tracking-wider text-chalk">
                      {isSelected && <Check className="w-3 h-3 text-saffron" />}
                      <span>{take.kicker || `TAKE 0${i + 1}`}</span>
                    </div>

                    {/* Dimensions & Seed Tag */}
                    <div className="absolute top-3 right-3 rounded-md bg-ink/80 px-1.5 py-0.5 backdrop-blur font-mono text-[9px] text-mist">
                      {take.width}×{take.height}
                    </div>

                    {/* Quick Action Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setLightboxImage(take.url!)
                          }}
                          className="btn-press rounded-md bg-ink/80 p-2 text-chalk hover:bg-ink backdrop-blur border border-white/10"
                          title="View Fullscreen"
                        >
                          <Maximize2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            downloadImage(take.url!, i)
                          }}
                          className="btn-press rounded-md bg-ink/80 p-2 text-chalk hover:bg-ink backdrop-blur border border-white/10"
                          title="Download Take"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          sendToVideo(take.url!)
                        }}
                        className="btn-press flex items-center gap-1.5 rounded-md bg-cobalt px-3 py-1.5 text-xs font-semibold text-chalk hover:bg-[#4A70FF] shadow"
                        title="Animate to Video"
                      >
                        <Clapperboard className="w-3.5 h-3.5" />
                        Make Video
                      </button>
                    </div>
                  </>
                ) : isProcessing ? (
                  /* 2. PROCESSING: Active Diffusion Synthesis */
                  <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cobalt/20 text-cobalt mb-3 animate-spin">
                      <RefreshCw className="h-6 w-6" />
                    </div>
                    <span className="font-mono text-xs uppercase tracking-wider text-chalk font-semibold">
                      {take?.creativeDirection || defaultCard.name}
                    </span>
                    <p className="mt-1 font-mono text-[11px] text-cobalt animate-pulse">
                      Synthesizing diffusion frame…
                    </p>
                  </div>
                ) : isRetrying ? (
                  /* 3. RETRYING: Exponential Backoff Status */
                  <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 mb-3 animate-pulse">
                      <RotateCw className="h-5 w-5" />
                    </div>
                    <span className="font-mono text-xs uppercase tracking-wider text-amber-300 font-semibold">
                      Retrying Take 0{i + 1}
                    </span>
                    <p className="mt-1 text-xs text-mist max-w-[200px]">
                      {take?.statusMessage || "Queue congestion. Backing off…"}
                    </p>
                  </div>
                ) : isQueued ? (
                  /* 4. QUEUED: In Line */
                  <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-chalk/5 text-mist mb-3">
                      <Clock className="h-4 w-4" />
                    </div>
                    <span className="font-mono text-xs uppercase tracking-wider text-mist font-semibold">
                      {take?.creativeDirection || defaultCard.name}
                    </span>
                    <p className="mt-1 font-mono text-[10px] text-mist/60 uppercase">
                      Queued in line
                    </p>
                  </div>
                ) : isFailed ? (
                  /* 5. FAILED: Explicit Provider Error (No Fake Placeholder Artwork) */
                  <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 mb-3">
                      <AlertCircle className="h-4 w-4" />
                    </div>
                    <span className="font-mono text-xs uppercase tracking-wider text-rose-300 font-semibold">
                      Generation Failed
                    </span>
                    <p className="mt-1 text-xs text-rose-400/80 max-w-[220px] line-clamp-2">
                      {take?.errorMessage || "Diffusion provider timed out."}
                    </p>
                  </div>
                ) : isCancelled ? (
                  /* 6. CANCELLED */
                  <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                    <span className="font-mono text-xs uppercase tracking-wider text-mist font-semibold">
                      Cancelled
                    </span>
                  </div>
                ) : (
                  /* 7. IDLE / DEFAULT */
                  <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                    <span className="font-mono text-xs uppercase tracking-widest text-mist/60 font-semibold">
                      {defaultCard.kicker}
                    </span>
                    <p className="mt-2 text-xs font-semibold text-chalk/80">
                      {defaultCard.name}
                    </p>
                    <p className="mt-1 text-[11px] text-mist/40 max-w-[190px]">
                      {defaultCard.desc}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <p className="mt-4 line-clamp-2 font-mono text-[11px] text-mist">
          {prompt} · {ratio} · {PAPERS.find((p) => p.id === paper)?.label}
        </p>
      </div>

      {/* Fullscreen Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
          onClick={() => setLightboxImage(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxImage(null)}
            className="absolute top-6 right-6 rounded-full bg-ink/80 p-3 text-chalk hover:bg-ink border border-white/10"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="relative max-w-5xl max-h-[85vh] overflow-hidden rounded-2xl border border-white/10" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxImage}
              alt="High Resolution Preview"
              className="max-h-[80vh] w-auto object-contain"
            />
            <div className="absolute bottom-4 right-4 flex gap-3">
              <button
                type="button"
                onClick={() => downloadImage(lightboxImage, selectedIndex)}
                className="btn-press flex items-center gap-2 rounded-md bg-cobalt px-4 py-2 text-sm font-semibold text-chalk hover:bg-[#4A70FF]"
              >
                <Download className="w-4 h-4" />
                Download High-Res
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
