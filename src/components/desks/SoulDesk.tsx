"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Sparkles,
  RefreshCw,
  Download,
  Clapperboard,
  Ban,
  AlertCircle,
  Lock,
  User,
  Crown,
  Shirt,
  Smile,
} from "lucide-react"
import PublishPanel from "@/components/explore/PublishPanel"
import type { GenerationTake, BatchDetailResponse } from "@/lib/generation-types"

const SOUL_ARCHETYPES = [
  { id: "hero", label: "Cinematic Hero", desc: "Charismatic leading protagonist" },
  { id: "fashion", label: "Fashion Model", desc: "Haute couture & editorial runway" },
  { id: "cyber", label: "Cyberpunk Operative", desc: "Tactical techwear & neon aesthetic" },
  { id: "realism", label: "Digital Human", desc: "Hyper-realistic authentic portrait" },
  { id: "anime", label: "Stylized Avatar", desc: "Modern cinematic anime concept" },
]

const EXPRESSIONS = [
  { id: "confident", label: "Confident & Piercing" },
  { id: "dramatic", label: "Dramatic & Intense" },
  { id: "serene", label: "Serene & Elegant" },
  { id: "mysterious", label: "Mysterious & Shadowed" },
]

const WARDROBES = [
  { id: "couture", label: "High Fashion Couture" },
  { id: "streetwear", label: "Modern Luxury Streetwear" },
  { id: "techwear", label: "Cybernetic Techwear" },
  { id: "vintage", label: "Vintage 35mm Analog" },
]

const RATIOS = ["1:1", "9:16", "16:9", "4:3"] as const

const DEFAULT_SOUL_CARDS = [
  { takeNumber: 1, kicker: "01 PORTRAIT", name: "Close-Up Hero", desc: "Detailed facial features and piercing gaze" },
  { takeNumber: 2, kicker: "02 THREE-QUARTER", name: "Three-Quarter View", desc: "Dynamic posture and silhouette" },
  { takeNumber: 3, kicker: "03 PROFILE", name: "Dramatic Profile", desc: "Cinematic side-profile lighting" },
  { takeNumber: 4, kicker: "04 FULL-BODY", name: "Full Fashion Stance", desc: "Full wardrobe and environmental presence" },
]

export default function SoulDesk() {
  const [characterName, setCharacterName] = useState("Kaelen")
  const [prompt, setPrompt] = useState(
    "A striking person with platinum hair, sharp cheekbones, wearing an architectural silk blazer against minimalist concrete architecture"
  )
  const [archetype, setArchetype] = useState("hero")
  const [expression, setExpression] = useState("confident")
  const [wardrobe, setWardrobe] = useState("couture")
  const [ratio, setRatio] = useState<(typeof RATIOS)[number]>("9:16")

  const [activeBatchId, setActiveBatchId] = useState<string | null>(null)
  const [takes, setTakes] = useState<GenerationTake[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [errorMessage, setErrorMessage] = useState("")

  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()

  const pollBatchStatus = useCallback(async (batchId: string) => {
    try {
      const res = await fetch(`/api/generations/${batchId}`)
      if (!res.ok) return
      const data = (await res.json()) as BatchDetailResponse
      if (data.ok && data.takes) {
        setTakes(data.takes)
        const allCompleted = data.takes.every(
          (t) => t.status === "completed" || t.status === "failed" || t.status === "cancelled"
        )
        if (allCompleted) {
          setIsGenerating(false)
          if (pollingRef.current) clearInterval(pollingRef.current)
        }
      }
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    if (isGenerating && activeBatchId) {
      if (pollingRef.current) clearInterval(pollingRef.current)
      pollingRef.current = setInterval(() => {
        void pollBatchStatus(activeBatchId)
      }, 1400)
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

  const handleGenerate = async () => {
    setIsGenerating(true)
    setErrorMessage("")
    try {
      const archLabel = SOUL_ARCHETYPES.find((a) => a.id === archetype)?.label
      const exprLabel = EXPRESSIONS.find((e) => e.id === expression)?.label
      const wardLabel = WARDROBES.find((w) => w.id === wardrobe)?.label

      const fullPrompt = `Consistent Soul Character: ${characterName}, ${archLabel} aesthetic, ${prompt}, ${exprLabel} expression, wearing ${wardLabel}, award-winning portrait photography, 8k resolution, photorealistic skin texture, master studio lighting`

      const res = await fetch("/api/generations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "image",
          prompt: fullPrompt,
          ratio,
          paper: "studio",
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.ok) {
        setErrorMessage(data.error || "Failed to initialize Soul character batch.")
        setIsGenerating(false)
        return
      }

      setActiveBatchId(data.batchId)
      setTakes(data.takes || [])
      setSelectedIndex(0)
    } catch {
      setErrorMessage("Network error initializing character generation.")
      setIsGenerating(false)
    }
  }

  const handleCancel = async () => {
    if (!activeBatchId) return
    try {
      await fetch(`/api/generations/${activeBatchId}/cancel`, { method: "POST" })
      setIsGenerating(false)
    } catch {
      /* ignore */
    }
  }

  const downloadTake = (take: GenerationTake) => {
    if (!take.url) return
    const link = document.createElement("a")
    link.href = take.url
    link.download = `soul_${characterName}_take0${take.takeNumber}.jpg`
    link.target = "_blank"
    link.rel = "noreferrer"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const completedTakesCount = takes.filter((t) => t.status === "completed" && Boolean(t.url)).length
  const selectedTake = takes[selectedIndex]

  return (
    <div className="page-max page-pad grid min-w-0 gap-8 pt-[calc(var(--header-offset)+2rem)] lg:grid-cols-[minmax(0,24rem)_1fr] lg:gap-12 lg:pt-[calc(var(--header-offset)+3rem)]">
      {/* Controls Column */}
      <div className="order-2 min-w-0 lg:order-1">
        <div className="flex items-center gap-2">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-saffron">Higgsfield Soul Studio</p>
          <span className="rounded bg-saffron/20 px-2 py-0.5 font-mono text-[10px] text-saffron font-semibold">
            Soul ID v2.0
          </span>
        </div>

        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-chalk text-balance md:text-5xl">
          Soul Identity.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-mist">
          Create consistent AI characters and personas across multi-take studio sessions and direct them in Cinema Studio.
        </p>

        {/* Character Name */}
        <div className="mt-6 flex items-center justify-between">
          <label htmlFor="char-name" className="block font-mono text-[11px] uppercase tracking-[0.16em] text-mist flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-saffron" />
            Character ID / Persona Name
          </label>
        </div>
        <input
          id="char-name"
          type="text"
          value={characterName}
          onChange={(e) => setCharacterName(e.target.value)}
          disabled={isGenerating}
          placeholder="e.g. Kaelen, Lyra, Marcus…"
          className={`mt-2 w-full rounded-md border border-chalk/15 bg-slateink p-3 text-sm text-chalk placeholder:text-mist/50 focus:border-cobalt focus:outline-none ${
            isGenerating ? "opacity-60 cursor-not-allowed" : ""
          }`}
        />

        {/* Archetype */}
        <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.16em] text-mist flex items-center gap-1.5">
          <Crown className="w-3.5 h-3.5 text-cobalt" />
          Persona Archetype
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {SOUL_ARCHETYPES.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setArchetype(a.id)}
              disabled={isGenerating}
              className={`btn-press touch rounded-md p-3 text-left transition-all ${
                isGenerating ? "cursor-not-allowed opacity-60" : ""
              } ${
                archetype === a.id ? "border border-cobalt bg-cobalt/20 text-chalk" : "border border-chalk/15 text-mist hover:text-chalk"
              }`}
            >
              <p className="text-xs font-semibold text-chalk">{a.label}</p>
              <p className="text-[10px] text-mist/70 mt-0.5">{a.desc}</p>
            </button>
          ))}
        </div>

        {/* Prompt Description */}
        <div className="mt-6 flex items-center justify-between">
          <label htmlFor="char-brief" className="block font-mono text-[11px] uppercase tracking-[0.16em] text-mist">
            Visual Traits & Styling Brief
          </label>
          {isGenerating && (
            <span className="inline-flex items-center gap-1 font-mono text-[10px] text-saffron bg-saffron/10 px-2 py-0.5 rounded border border-saffron/30">
              <Lock className="w-3 h-3" />
              Soul Locked
            </span>
          )}
        </div>
        <textarea
          id="char-brief"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={isGenerating}
          rows={3}
          spellCheck={false}
          autoComplete="off"
          className={`mt-2 w-full resize-none rounded-md border border-chalk/15 bg-slateink p-4 text-sm text-chalk placeholder:text-mist/50 focus:border-cobalt focus:outline-none transition-opacity ${
            isGenerating ? "opacity-60 cursor-not-allowed" : ""
          }`}
        />

        {/* Expression & Wardrobe */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-mist flex items-center gap-1">
              <Smile className="w-3 h-3" />
              Expression
            </p>
            <div className="mt-2 space-y-1.5">
              {EXPRESSIONS.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => setExpression(e.id)}
                  disabled={isGenerating}
                  className={`btn-press touch w-full rounded py-1.5 px-2 text-left font-mono text-[11px] transition-all ${
                    isGenerating ? "cursor-not-allowed opacity-60" : ""
                  } ${
                    expression === e.id ? "bg-chalk text-ink font-semibold" : "border border-chalk/15 text-mist hover:text-chalk"
                  }`}
                >
                  {e.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-mist flex items-center gap-1">
              <Shirt className="w-3 h-3" />
              Wardrobe
            </p>
            <div className="mt-2 space-y-1.5">
              {WARDROBES.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => setWardrobe(w.id)}
                  disabled={isGenerating}
                  className={`btn-press touch w-full rounded py-1.5 px-2 text-left font-mono text-[11px] transition-all ${
                    isGenerating ? "cursor-not-allowed opacity-60" : ""
                  } ${
                    wardrobe === w.id ? "bg-chalk text-ink font-semibold" : "border border-chalk/15 text-mist hover:text-chalk"
                  }`}
                >
                  {w.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Aspect Ratio */}
        <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.16em] text-mist">Portrait Ratio</p>
        <div className="mt-2 flex gap-2">
          {RATIOS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRatio(r)}
              disabled={isGenerating}
              className={`btn-press touch flex-1 rounded-md py-2 font-mono text-xs tabular-nums transition-all ${
                isGenerating ? "cursor-not-allowed opacity-60" : ""
              } ${
                ratio === r ? "bg-cobalt text-chalk font-semibold" : "border border-chalk/15 text-mist hover:text-chalk"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex gap-3">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="btn-press flex-1 flex touch items-center justify-center gap-2 rounded-md bg-cobalt px-6 py-3.5 text-sm font-semibold text-chalk hover:bg-[#4A70FF] disabled:opacity-70 shadow-lg shadow-cobalt/20"
          >
            {isGenerating ? <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Sparkles className="h-4 w-4" />}
            {isGenerating ? "Synthesizing 4 Persona Takes…" : "Generate Character Takes"}
          </button>

          {isGenerating && (
            <button
              type="button"
              onClick={handleCancel}
              className="btn-press flex items-center justify-center gap-1.5 rounded-md border border-rose-500/30 bg-rose-500/10 px-4 py-3.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20"
            >
              <Ban className="h-4 w-4" />
              Cancel
            </button>
          )}
        </div>

        {errorMessage && (
          <div className="mt-3 flex items-center gap-2 rounded-md border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {completedTakesCount > 0 && selectedTake?.url && (
          <PublishPanel kind="image" prompt={`Soul Character: ${characterName}, ${prompt}`} ratio={ratio} />
        )}
      </div>

      {/* 4-Take Character Viewport Column */}
      <div className="order-1 min-w-0 lg:order-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <p className="font-mono text-xs uppercase tracking-wider text-mist">
              {takes.length > 0 ? `Soul ID: ${characterName} (4 Takes)` : "Soul Studio Viewport"}
            </p>
            {isGenerating && (
              <span className="inline-flex items-center gap-1 rounded-full bg-cobalt/20 px-2 py-0.5 font-mono text-[10px] text-cobalt font-semibold animate-pulse">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Synthesizing Identity
              </span>
            )}
          </div>

          {completedTakesCount > 0 && (
            <span className="font-mono text-xs text-saffron">
              Completed: {completedTakesCount}/4 · Selected: Take 0{selectedIndex + 1}
            </span>
          )}
        </div>

        <div className={`grid gap-4 ${ratio === "9:16" ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-1 sm:grid-cols-2"}`}>
          {[0, 1, 2, 3].map((i) => {
            const take = takes[i]
            const defaultCard = DEFAULT_SOUL_CARDS[i]
            const isCompleted = take?.status === "completed" && Boolean(take.url)
            const isProcessing = take?.status === "processing"
            const isRetrying = take?.status === "retrying"
            const isQueued = take?.status === "queued"
            const isFailed = take?.status === "failed" || take?.status === "provider_unavailable"
            const isSelected = selectedIndex === i

            return (
              <div
                key={take?._id || `soul-card-${i}`}
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
                  isSelected
                    ? "border-saffron ring-2 ring-saffron/40 shadow-xl shadow-saffron/10"
                    : "border-chalk/15 hover:border-chalk/30 bg-slateink"
                } ${isCompleted ? "cursor-pointer" : "cursor-default"}`}
              >
                {isCompleted && take.url ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={take.url}
                      alt={take.creativeDirection || `Character take 0${i + 1}`}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 rounded-full bg-ink/70 px-2 py-0.5 backdrop-blur-md">
                      <span className="font-mono text-[10px] uppercase font-bold text-saffron">
                        {defaultCard.kicker}
                      </span>
                    </div>

                    {/* Quick Action Overlay */}
                    <div className="absolute bottom-2.5 inset-x-2.5 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          downloadTake(take)
                        }}
                        className="btn-press rounded-full bg-white/10 p-2 text-chalk backdrop-blur hover:bg-white/20"
                        title="Download Portrait"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/video?prompt=${encodeURIComponent(prompt)}&image=${encodeURIComponent(take.url!)}`)
                        }}
                        className="btn-press flex items-center gap-1 rounded-full bg-cobalt px-2.5 py-1 text-[11px] font-semibold text-chalk shadow"
                        title="Animate in Cinema Studio"
                      >
                        <Clapperboard className="w-3 h-3" />
                        Animate Video
                      </button>
                    </div>
                  </>
                ) : isProcessing ? (
                  <div className="flex h-full w-full flex-col items-center justify-center p-4 text-center bg-ink">
                    <RefreshCw className="h-6 w-6 text-cobalt animate-spin mb-2" />
                    <p className="font-mono text-[11px] text-cobalt font-semibold">Synthesizing {defaultCard.kicker}</p>
                    <p className="text-[10px] text-mist/60 mt-1">FLUX.1 Diffusion</p>
                  </div>
                ) : isRetrying ? (
                  <div className="flex h-full w-full flex-col items-center justify-center p-4 text-center bg-saffron/10 border border-saffron/20">
                    <RefreshCw className="h-6 w-6 text-saffron animate-spin mb-2" />
                    <p className="font-mono text-[11px] text-saffron font-semibold">Retrying Take…</p>
                  </div>
                ) : isQueued ? (
                  <div className="flex h-full w-full flex-col items-center justify-center p-4 text-center bg-slateink/50">
                    <span className="h-2 w-2 rounded-full bg-mist/40 animate-ping mb-2" />
                    <p className="font-mono text-[10px] uppercase text-mist">{defaultCard.kicker}</p>
                    <p className="text-[11px] text-mist/60 mt-0.5">Queued in batch</p>
                  </div>
                ) : isFailed ? (
                  <div className="flex h-full w-full flex-col items-center justify-center p-4 text-center bg-rose-500/10 border border-rose-500/20">
                    <AlertCircle className="h-5 w-5 text-rose-400 mb-1" />
                    <p className="font-mono text-[10px] text-rose-300">Take Failed</p>
                  </div>
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center p-4 text-center bg-slateink/30">
                    <User className="h-6 w-6 text-mist/30 mb-2" />
                    <p className="font-mono text-[10px] font-semibold uppercase text-mist/70">{defaultCard.kicker}</p>
                    <p className="text-[10px] text-mist/50 mt-0.5">{defaultCard.name}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Selected Hero Take Detail */}
        {selectedTake?.url && (
          <div className="mt-6 rounded-xl border border-chalk/15 bg-slateink/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono text-xs text-saffron uppercase font-semibold">
                  Selected Soul Persona · {characterName}
                </p>
                <p className="text-xs text-mist mt-0.5 line-clamp-1">{prompt}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => downloadTake(selectedTake)}
                  className="btn-press flex items-center gap-1.5 rounded bg-white/10 px-3 py-1.5 text-xs text-chalk hover:bg-white/20"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </button>

                <button
                  type="button"
                  onClick={() =>
                    router.push(`/video?prompt=${encodeURIComponent(prompt)}&image=${encodeURIComponent(selectedTake.url!)}`)
                  }
                  className="btn-press flex items-center gap-1.5 rounded bg-cobalt px-3 py-1.5 text-xs font-semibold text-chalk hover:bg-[#4A70FF] shadow"
                >
                  <Clapperboard className="w-3.5 h-3.5" />
                  Direct in Cinema Studio
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
