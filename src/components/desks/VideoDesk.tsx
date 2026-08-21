"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Play, Pause, RefreshCw, Download, Clapperboard, Sparkles, RotateCcw, AlertCircle, Ban } from "lucide-react"
import PublishPanel from "@/components/explore/PublishPanel"
import type { BatchDetailResponse } from "@/lib/generation-types"

const LENGTHS = ["4s", "8s", "12s"] as const
const MOTIONS = [
  { id: "pan", label: "Slow pan", desc: "Cinematic horizontal tracking" },
  { id: "push", label: "Push in", desc: "Forward dollying movement" },
  { id: "orbit", label: "Orbit", desc: "Smooth 360 rotation around subject" },
  { id: "tilt", label: "Dynamic tilt", desc: "Vertical upward cinematic sweep" },
  { id: "drone", label: "Drone aerial", desc: "Sweeping high-altitude movement" },
  { id: "lock", label: "Locked cam", desc: "Static tripod frame with subtle atmosphere" },
]
const RATIOS = ["16:9", "9:16", "1:1"] as const

export default function VideoDesk() {
  const [prompt, setPrompt] = useState(() => {
    if (typeof window === "undefined") return "A dancer steps through dust and tungsten, handheld, 35mm"
    return new URLSearchParams(window.location.search).get("prompt") || "A dancer steps through dust and tungsten, handheld, 35mm"
  })
  const [length, setLength] = useState<(typeof LENGTHS)[number]>("8s")
  const [motion, setMotion] = useState("pan")
  const [ratio, setRatio] = useState<(typeof RATIOS)[number]>("16:9")

  const [activeBatchId, setActiveBatchId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [note, setNote] = useState("")

  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            setIsPlaying(false)
            return 0
          }
          return prev + 2
        })
      }, 100)
    }
    return () => clearInterval(interval)
  }, [isPlaying])

  const pollVideoStatus = useCallback(async (batchId: string) => {
    try {
      const res = await fetch(`/api/generations/${batchId}`)
      if (!res.ok) return
      const data = (await res.json()) as BatchDetailResponse
      if (data.ok && data.takes && data.takes.length > 0) {
        const take = data.takes[0]
        if (take.status === "completed" && take.url) {
          setVideoPreview(take.url)
          setBusy(false)
          setIsPlaying(true)
          if (pollingRef.current) clearInterval(pollingRef.current)
        } else if (take.status === "failed" || take.status === "provider_unavailable") {
          setNote(take.errorMessage || "Motion rendering failed.")
          setBusy(false)
          if (pollingRef.current) clearInterval(pollingRef.current)
        }
      }
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    if (busy && activeBatchId) {
      if (pollingRef.current) clearInterval(pollingRef.current)
      pollingRef.current = setInterval(() => {
        void pollVideoStatus(activeBatchId)
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
  }, [busy, activeBatchId, pollVideoStatus])

  const run = async () => {
    setBusy(true)
    setIsPlaying(false)
    setProgress(0)
    setNote("")
    try {
      const res = await fetch("/api/generations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "video", prompt, motion, length, ratio }),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) {
        setNote(json.error || "Could not generate.")
        setBusy(false)
        return
      }

      setActiveBatchId(json.batchId)
    } catch {
      setNote("Could not generate. Check network connection.")
      setBusy(false)
    }
  }

  const cancelRun = async () => {
    if (!activeBatchId) return
    try {
      await fetch(`/api/generations/${activeBatchId}/cancel`, { method: "POST" })
      setBusy(false)
    } catch {
      /* ignore */
    }
  }

  const downloadClip = () => {
    if (!videoPreview) return
    const link = document.createElement("a")
    link.href = videoPreview
    link.download = "flatify_video_clip.jpg"
    link.target = "_blank"
    link.rel = "noreferrer"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="page-max page-pad grid min-w-0 gap-8 pt-[calc(var(--header-offset)+2rem)] lg:grid-cols-[minmax(0,22rem)_1fr] lg:gap-12 lg:pt-[calc(var(--header-offset)+3rem)]">
      {/* Controls Column */}
      <div className="order-2 min-w-0 lg:order-1">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-saffron">AI Video & Motion Studio</p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-chalk text-balance md:text-5xl">
          Move the frame.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-mist">
          Direct camera choreography, depth of field, and frame motion with asynchronous rendering.
        </p>

        <label htmlFor="video-brief" className="mt-8 block font-mono text-[11px] uppercase tracking-[0.16em] text-mist">
          Motion Brief
        </label>
        <textarea
          id="video-brief"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          spellCheck={false}
          autoComplete="off"
          placeholder="A train window at night, reflections sliding, one amber interior light…"
          className="mt-2 w-full resize-none rounded-md border border-chalk/15 bg-slateink p-4 text-sm text-chalk placeholder:text-mist/50 focus:border-cobalt focus:outline-none"
        />

        <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.16em] text-mist">Clip Length</p>
        <div className="mt-2 flex gap-2" role="group" aria-label="Clip length">
          {LENGTHS.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLength(l)}
              className={`btn-press touch flex-1 rounded-md py-2.5 font-mono text-xs tabular-nums transition-colors ${
                length === l ? "bg-chalk text-ink font-semibold" : "border border-chalk/15 text-mist hover:text-chalk"
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.16em] text-mist">Camera Motion</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {MOTIONS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMotion(m.id)}
              className={`btn-press touch rounded-md p-3 text-left transition-colors ${
                motion === m.id ? "border border-cobalt bg-cobalt/20 text-chalk" : "border border-chalk/15 text-mist hover:text-chalk"
              }`}
            >
              <p className="text-sm font-semibold text-chalk">{m.label}</p>
              <p className="text-[11px] text-mist/70 mt-0.5">{m.desc}</p>
            </button>
          ))}
        </div>

        <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.16em] text-mist">Aspect Ratio</p>
        <div className="mt-2 flex gap-2">
          {RATIOS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRatio(r)}
              className={`btn-press touch flex-1 rounded-md py-2 font-mono text-xs tabular-nums transition-colors ${
                ratio === r ? "bg-cobalt text-chalk font-semibold" : "border border-chalk/15 text-mist hover:text-chalk"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <div className="mt-8 flex gap-3">
          <button
            type="button"
            onClick={run}
            disabled={busy}
            className="btn-press flex-1 flex touch items-center justify-center gap-2 rounded-md bg-cobalt px-6 py-3.5 text-sm font-semibold text-chalk hover:bg-[#4A70FF] disabled:opacity-70 shadow-lg shadow-cobalt/20"
          >
            {busy ? <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Sparkles className="h-4 w-4" />}
            {busy ? "Rendering Motion Take…" : "Generate Video Clip"}
          </button>

          {busy && (
            <button
              type="button"
              onClick={cancelRun}
              className="btn-press flex items-center justify-center gap-1.5 rounded-md border border-rose-500/30 bg-rose-500/10 px-4 py-3.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20"
            >
              <Ban className="h-4 w-4" />
              Cancel
            </button>
          )}
        </div>

        {note && (
          <div className="mt-3 flex items-center gap-2 rounded-md border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{note}</span>
          </div>
        )}

        {videoPreview && (
          <PublishPanel kind="video" prompt={prompt} ratio={ratio} motion={motion} length={length} />
        )}
      </div>

      {/* Video Studio Canvas Column */}
      <div className="order-1 min-w-0 lg:order-2">
        <div className="flex items-center justify-between mb-3">
          <p className="font-mono text-xs uppercase tracking-wider text-mist">
            Motion Player · {ratio} Frame
          </p>
          {videoPreview && (
            <span className="font-mono text-xs text-saffron flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-saffron animate-pulse" />
              Clip Ready
            </span>
          )}
        </div>

        <div
          className={`relative overflow-hidden rounded-2xl border border-chalk/15 bg-slateink shadow-2xl ${
            ratio === "9:16" ? "mx-auto aspect-[9/16] max-w-[320px]" : ratio === "1:1" ? "aspect-square w-full max-w-[540px] mx-auto" : "aspect-video w-full"
          }`}
        >
          {videoPreview ? (
            <div className="relative h-full w-full group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={videoPreview}
                alt="Generated clip preview"
                loading="eager"
                className={`h-full w-full object-cover transition-transform duration-1000 ${
                  isPlaying ? "scale-110 translate-x-1" : "scale-100"
                }`}
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />

              {/* Play / Pause Center Button */}
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className="btn-press absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-chalk/90 text-ink shadow-2xl backdrop-blur-md hover:bg-chalk hover:scale-105 transition-all"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <Pause className="h-6 w-6 text-ink" aria-hidden="true" />
                ) : (
                  <Play className="h-6 w-6 translate-x-0.5 text-ink" aria-hidden="true" />
                )}
              </button>

              {/* Bottom Video Controls Bar */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/95 via-ink/60 to-transparent p-4">
                {/* Scrubber */}
                <div className="h-1 w-full overflow-hidden rounded-full bg-white/20">
                  <div
                    className="h-full bg-saffron transition-all duration-100"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="mt-3 flex items-center justify-between font-mono text-xs text-chalk/90">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setProgress(0)
                        setIsPlaying(true)
                      }}
                      className="text-mist hover:text-chalk"
                      title="Replay"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <span>{isPlaying ? `00:0${Math.floor((progress / 100) * parseInt(length))}` : "00:00"} / 00:{length.padStart(2, "0")}</span>
                    <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-saffron">
                      {MOTIONS.find((m) => m.id === motion)?.label}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={downloadClip}
                      className="btn-press flex items-center gap-1 rounded bg-white/10 px-2.5 py-1 text-xs text-chalk hover:bg-white/20"
                    >
                      <Download className="w-3 h-3" />
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push("/studio")}
                      className="btn-press flex items-center gap-1 rounded bg-cobalt px-2.5 py-1 text-xs text-chalk hover:bg-[#4A70FF]"
                    >
                      <Clapperboard className="w-3 h-3" />
                      Timeline
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : busy ? (
            <div className="relative h-full w-full flex flex-col items-center justify-center p-8 text-center bg-ink">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cobalt/20 text-cobalt mb-3 animate-spin">
                <RefreshCw className="h-7 w-7" />
              </div>
              <h3 className="font-display text-lg font-semibold text-chalk">Synthesizing Motion</h3>
              <p className="text-xs text-cobalt font-mono animate-pulse mt-1">
                Directing camera motion and rendering diffusion clip…
              </p>
            </div>
          ) : (
            <div className="relative h-full w-full flex flex-col items-center justify-center p-8 text-center bg-ink">
              <div className="absolute inset-0 bg-gradient-to-br from-cobalt/20 via-ink to-saffron/10" />
              <div className="relative z-10 flex flex-col items-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-slateink/60 text-chalk mb-4 shadow-xl">
                  <Play className="h-6 w-6 translate-x-0.5 text-mist" aria-hidden="true" />
                </div>
                <h3 className="font-display text-lg font-semibold text-chalk">Ready to Direct</h3>
                <p className="text-xs text-mist/70 max-w-[240px] mt-1.5">
                  Set prompt, camera trajectory, and clip duration to render.
                </p>
              </div>
            </div>
          )}
        </div>
        <p className="mt-4 line-clamp-2 font-mono text-[11px] text-mist">{prompt}</p>
      </div>
    </div>
  )
}
