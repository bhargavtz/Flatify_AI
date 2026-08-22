"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  RefreshCw,
  Download,
  Clapperboard,
  Sparkles,
  AlertCircle,
  Ban,
  Film,
  Video as VideoIcon,
  Lock,
  Camera,
  Zap,
  Sliders,
  Image as ImageIcon,
  Compass,
  Play,
  Pause,
  RotateCcw,
} from "lucide-react"
import PublishPanel from "@/components/explore/PublishPanel"
import type { BatchDetailResponse } from "@/lib/generation-types"

const LENGTHS = ["4s", "8s", "12s"] as const

const VIDEO_MODELS = [
  { id: "kling", name: "Kling AI 1.5", desc: "Directorial Camera Dynamics & Physics" },
  { id: "veo-2", name: "Google Veo 2", desc: "4K High Dynamic Generative Video" },
  { id: "luma-ray", name: "Luma Ray 2", desc: "Photorealistic 3D Camera Sweeps" },
  { id: "wan-2.1", name: "Wan2.1 SOTA", desc: "14B Open Video Foundation Model" },
  { id: "minimax", name: "Minimax Hailuo", desc: "Cinematic Character Motion & Pacing" },
  { id: "flux-motion", name: "FLUX.1 Cinema", desc: "Neural Motion & Keyframe Synthesis" },
]

const CAMERA_RIGS = [
  { id: "orbit", label: "360° Orbit", desc: "Rotational 3D arc around subject" },
  { id: "crane", label: "Crane / Jib", desc: "Vertical elevation boom shot" },
  { id: "fpv", label: "FPV Drone", desc: "Dynamic high-speed fly-through" },
  { id: "dolly_zoom", label: "Dolly Zoom", desc: "Hitchcock vertigo perspective warp" },
  { id: "tracking", label: "Steadicam", desc: "Smooth horizontal tracking slide" },
  { id: "handheld", label: "Handheld", desc: "Natural documentary micro-motion" },
  { id: "lock", label: "Locked Tripod", desc: "Static master framing with atmosphere" },
]

const LENSES = [
  { id: "35mm_cine", label: "35mm Anamorphic", desc: "Cinematic horizontal flares & wide field" },
  { id: "50mm_prime", label: "50mm Master Prime", desc: "Natural human eye focal perspective" },
  { id: "85mm_portrait", label: "85mm f/1.4 Telephoto", desc: "Shallow depth of field & creamy bokeh" },
  { id: "24mm_wide", label: "24mm Ultra-Wide", desc: "Dramatic architectural perspective" },
]

const SPEEDS = [
  { id: "0.5x", label: "0.5x Slow-Mo" },
  { id: "1.0x", label: "1.0x Realtime" },
  { id: "1.5x", label: "1.5x Dynamic" },
  { id: "2.0x", label: "2.0x Hyperlapse" },
]

const RATIOS = ["16:9", "9:16", "1:1", "2.39:1"] as const

export default function VideoDesk() {
  const [prompt, setPrompt] = useState(() => {
    if (typeof window === "undefined") return "A cinematic sports car speeding along a coastal cliff at golden hour, 4k"
    return new URLSearchParams(window.location.search).get("prompt") || "A cinematic sports car speeding along a coastal cliff at golden hour, 4k"
  })
  const [sourceImage, setSourceImage] = useState<string | null>(() => {
    if (typeof window === "undefined") return null
    return new URLSearchParams(window.location.search).get("image") || null
  })
  const [mode, setMode] = useState<"text" | "image">(sourceImage ? "image" : "text")

  const [model, setModel] = useState("kling")
  const [length, setLength] = useState<(typeof LENGTHS)[number]>("8s")
  const [motion, setMotion] = useState("orbit")
  const [lens, setLens] = useState("35mm_cine")
  const [speed, setSpeed] = useState("1.0x")
  const [ratio, setRatio] = useState<(typeof RATIOS)[number]>("16:9")

  const [activeBatchId, setActiveBatchId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [note, setNote] = useState("")

  // Playback & Animation State
  const [isPlaying, setIsPlaying] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)
  const [isExporting, setIsExporting] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const imageObjRef = useRef<HTMLImageElement | null>(null)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()

  const durationSeconds = length === "4s" ? 4 : length === "8s" ? 8 : 12

  // Preload and initialize motion renderer when videoUrl arrives
  useEffect(() => {
    if (!videoUrl) return

    const img = new window.Image()
    img.crossOrigin = "anonymous"
    img.src = videoUrl
    img.onload = () => {
      imageObjRef.current = img
      startTimeRef.current = performance.now()
    }
  }, [videoUrl])

  // 60 FPS Directorial Motion Animation Engine
  useEffect(() => {
    if (!videoUrl || !canvasRef.current) return

    let running = true

    const renderFrame = (now: number) => {
      if (!running) return

      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      if (!startTimeRef.current) startTimeRef.current = now

      let elapsed = (now - startTimeRef.current) / 1000
      if (elapsed > durationSeconds) {
        startTimeRef.current = now
        elapsed = 0
      }

      setCurrentTime(elapsed)

      const w = canvas.width
      const h = canvas.height
      ctx.clearRect(0, 0, w, h)

      const img = imageObjRef.current
      if (img && img.complete) {
        ctx.save()

        const progress = elapsed / durationSeconds
        const speedMultiplier = speed === "0.5x" ? 0.5 : speed === "1.5x" ? 1.5 : speed === "2.0x" ? 2.0 : 1.0
        const t = (progress * speedMultiplier) % 1.0

        // Directorial Camera Trajectory Math
        let scale = 1.05 + Math.sin(t * Math.PI) * 0.08
        let offsetX = 0
        let offsetY = 0
        let rotation = 0

        if (motion === "orbit") {
          // 360° Rotational Arc
          offsetX = Math.sin(t * Math.PI * 2) * (w * 0.04)
          offsetY = Math.cos(t * Math.PI * 2) * (h * 0.02)
          rotation = Math.sin(t * Math.PI * 2) * 0.025
          scale = 1.08 + Math.cos(t * Math.PI * 2) * 0.04
        } else if (motion === "crane") {
          // Vertical Elevation Boom
          offsetY = (0.5 - t) * (h * 0.12)
          scale = 1.05 + t * 0.06
        } else if (motion === "fpv") {
          // High-speed Forward Swoop
          scale = 1.0 + t * 0.25
          offsetX = Math.sin(t * Math.PI * 3) * (w * 0.03)
          rotation = Math.sin(t * Math.PI * 2) * 0.035
        } else if (motion === "dolly_zoom") {
          // Hitchcock Vertigo Zoom
          scale = 1.0 + t * 0.22
          offsetX = (t - 0.5) * (w * 0.02)
        } else if (motion === "tracking") {
          // Smooth Steadicam Horizontal Slide
          offsetX = (0.5 - t) * (w * 0.14)
          scale = 1.06
        } else if (motion === "handheld") {
          // Organic Micro-motion & Camera Sway
          offsetX = Math.sin(t * Math.PI * 6) * (w * 0.015)
          offsetY = Math.cos(t * Math.PI * 4) * (h * 0.015)
          rotation = Math.sin(t * Math.PI * 5) * 0.012
          scale = 1.06
        }

        // Apply transformations centered on subject
        ctx.translate(w / 2, h / 2)
        ctx.rotate(rotation)
        ctx.scale(scale, scale)
        ctx.translate(-w / 2 + offsetX, -h / 2 + offsetY)

        // Draw image keeping aspect ratio
        ctx.drawImage(img, 0, 0, w, h)
        ctx.restore()

        // Subtle cinematic optical vignette & atmosphere
        const gradient = ctx.createRadialGradient(w / 2, h / 2, w * 0.35, w / 2, h / 2, w * 0.75)
        gradient.addColorStop(0, "rgba(0,0,0,0)")
        gradient.addColorStop(1, "rgba(0,0,0,0.35)")
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, w, h)
      }

      if (isPlaying) {
        animFrameRef.current = requestAnimationFrame(renderFrame)
      }
    }

    if (isPlaying) {
      animFrameRef.current = requestAnimationFrame(renderFrame)
    }

    return () => {
      running = false
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [videoUrl, isPlaying, durationSeconds, motion, speed])

  // Polling for active video generation job
  const pollVideoStatus = useCallback(async (batchId: string) => {
    try {
      const res = await fetch(`/api/generations/${batchId}`)
      if (!res.ok) return
      const data = (await res.json()) as BatchDetailResponse
      if (data.ok && data.takes && data.takes.length > 0) {
        const take = data.takes[0]
        if (take.status === "completed" && take.url) {
          setVideoUrl(take.url)
          setBusy(false)
          if (pollingRef.current) clearInterval(pollingRef.current)
        } else if (take.status === "failed" || take.status === "provider_unavailable") {
          setNote(take.errorMessage || "Video generation failed.")
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
  }, [busy, activeBatchId, pollVideoStatus])

  const run = async () => {
    setBusy(true)
    setNote("")
    try {
      const fullPrompt = `${prompt}, directed with ${CAMERA_RIGS.find((r) => r.id === motion)?.label} camera motion, shot on ${LENSES.find((l) => l.id === lens)?.label}, ${speed} motion pace`
      const res = await fetch("/api/generations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "video",
          prompt: fullPrompt,
          motion,
          length,
          ratio: ratio === "2.39:1" ? "16:9" : ratio,
          requestedModel: model,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) {
        setNote(json.error || "Could not generate video.")
        setBusy(false)
        return
      }

      setActiveBatchId(json.batchId)
    } catch {
      setNote("Could not generate video. Check network connection.")
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

  // True Video File Recorder & Exporter
  const downloadVideo = async () => {
    if (!canvasRef.current && !videoUrl) return

    // If native video URL is an mp4/webm, download directly
    if (videoUrl?.endsWith(".mp4") || videoUrl?.endsWith(".webm")) {
      const link = document.createElement("a")
      link.href = videoUrl
      link.download = `higgsfield_${model}_video_${Date.now()}.mp4`
      link.target = "_blank"
      link.rel = "noreferrer"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      return
    }

    // Otherwise record canvas stream to WebM/MP4
    const canvas = canvasRef.current
    if (!canvas) return

    setIsExporting(true)
    try {
      const stream = canvas.captureStream(30)
      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
          ? "video/webm;codecs=vp9"
          : "video/webm",
      })

      const chunks: Blob[] = []
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `higgsfield_${model}_cinema_${Date.now()}.webm`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        setIsExporting(false)
      }

      recorder.start()
      setTimeout(() => {
        if (recorder.state === "recording") {
          recorder.stop()
        }
      }, durationSeconds * 1000)
    } catch (err) {
      console.warn("Direct stream recording fallback:", err)
      setIsExporting(false)
      if (videoUrl) {
        const link = document.createElement("a")
        link.href = videoUrl
        link.download = `higgsfield_cinema_${Date.now()}.jpg`
        link.click()
      }
    }
  }

  return (
    <div className="page-max page-pad grid min-w-0 gap-8 pt-[calc(var(--header-offset)+2rem)] lg:grid-cols-[minmax(0,24rem)_1fr] lg:gap-12 lg:pt-[calc(var(--header-offset)+3rem)]">
      {/* Directorial Controls Column */}
      <div className="order-2 min-w-0 lg:order-1">
        <div className="flex items-center gap-2">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-saffron">Higgsfield Cinema Studio</p>
          <span className="rounded bg-cobalt/20 px-2 py-0.5 font-mono text-[10px] text-cobalt font-semibold">
            v2.0 Directorial
          </span>
        </div>

        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-chalk text-balance md:text-5xl">
          Direct AI Cinema.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-mist">
          Direct camera motion rigs, lens focal characteristics, and motion dynamics with cinematic AI video generation.
        </p>

        {/* Mode Selector */}
        <div className="mt-6 flex rounded-lg border border-chalk/15 bg-slateink/50 p-1">
          <button
            type="button"
            onClick={() => setMode("text")}
            disabled={busy}
            className={`flex-1 flex items-center justify-center gap-2 rounded-md py-2 text-xs font-semibold transition-colors ${
              mode === "text" ? "bg-cobalt text-chalk shadow" : "text-mist hover:text-chalk"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Prompt to Video
          </button>
          <button
            type="button"
            onClick={() => setMode("image")}
            disabled={busy}
            className={`flex-1 flex items-center justify-center gap-2 rounded-md py-2 text-xs font-semibold transition-colors ${
              mode === "image" ? "bg-cobalt text-chalk shadow" : "text-mist hover:text-chalk"
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            Animate Frame
          </button>
        </div>

        {mode === "image" && (
          <div className="mt-4 rounded-lg border border-dashed border-chalk/20 bg-slateink/30 p-4 text-center">
            {sourceImage ? (
              <div className="relative aspect-video w-full overflow-hidden rounded-md border border-chalk/20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={sourceImage} alt="Source frame" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setSourceImage(null)}
                  className="btn-press absolute right-2 top-2 rounded bg-black/70 px-2 py-1 text-[10px] text-chalk backdrop-blur"
                >
                  Change Frame
                </button>
              </div>
            ) : (
              <div className="py-3">
                <ImageIcon className="mx-auto h-7 w-7 text-mist" />
                <p className="mt-1 text-xs font-semibold text-chalk">Import Hero Frame to Animate</p>
                <p className="text-[11px] text-mist/70">Select an image from your library or generator</p>
                <button
                  type="button"
                  onClick={() => router.push("/images")}
                  className="btn-press mt-2 inline-flex items-center gap-1 rounded bg-white/10 px-3 py-1.5 text-xs text-chalk hover:bg-white/20"
                >
                  <Compass className="w-3 h-3" />
                  Browse Image Studio
                </button>
              </div>
            )}
          </div>
        )}

        {/* AI Video Model Selector */}
        <div className="mt-6 flex items-center justify-between">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-mist flex items-center gap-1.5">
            <Film className="w-3.5 h-3.5 text-cobalt" />
            AI Video Model
          </p>
        </div>
        <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
          {VIDEO_MODELS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setModel(m.id)}
              disabled={busy}
              className={`btn-press touch rounded-md p-2.5 text-left transition-all ${
                busy ? "cursor-not-allowed opacity-60" : ""
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

        <div className="mt-6 flex items-center justify-between">
          <label htmlFor="video-brief" className="block font-mono text-[11px] uppercase tracking-[0.16em] text-mist">
            Cinematic Motion Brief
          </label>
          {busy && (
            <span className="inline-flex items-center gap-1 font-mono text-[10px] text-saffron bg-saffron/10 px-2 py-0.5 rounded border border-saffron/30">
              <Lock className="w-3 h-3" />
              Rig Locked
            </span>
          )}
        </div>
        <textarea
          id="video-brief"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={busy}
          rows={3}
          spellCheck={false}
          autoComplete="off"
          placeholder="A majestic waterfall cascading through a lush tropical rainforest at dawn, volumetric god rays, 4k…"
          className={`mt-2 w-full resize-none rounded-md border border-chalk/15 bg-slateink p-4 text-sm text-chalk placeholder:text-mist/50 focus:border-cobalt focus:outline-none transition-opacity ${
            busy ? "opacity-60 cursor-not-allowed" : ""
          }`}
        />

        {/* Camera Motion Rigs */}
        <div className="mt-6 flex items-center justify-between">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-mist flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5 text-saffron" />
            Camera Motion Rig
          </p>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {CAMERA_RIGS.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setMotion(r.id)}
              disabled={busy}
              className={`btn-press touch rounded-md p-3 text-left transition-all ${
                busy ? "cursor-not-allowed opacity-60" : ""
              } ${
                motion === r.id ? "border border-cobalt bg-cobalt/20 text-chalk" : "border border-chalk/15 text-mist hover:text-chalk"
              }`}
            >
              <p className="text-xs font-semibold text-chalk">{r.label}</p>
              <p className="text-[10px] text-mist/70 mt-0.5">{r.desc}</p>
            </button>
          ))}
        </div>

        {/* Cinematic Lenses */}
        <div className="mt-6 flex items-center justify-between">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-mist flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-cobalt" />
            Optics & Lens Profile
          </p>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {LENSES.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => setLens(l.id)}
              disabled={busy}
              className={`btn-press touch rounded-md p-2.5 text-left transition-all ${
                busy ? "cursor-not-allowed opacity-60" : ""
              } ${
                lens === l.id ? "border border-saffron bg-saffron/10 text-chalk" : "border border-chalk/15 text-mist hover:text-chalk"
              }`}
            >
              <p className="text-xs font-semibold text-chalk">{l.label}</p>
              <p className="text-[10px] text-mist/70 mt-0.5 line-clamp-1">{l.desc}</p>
            </button>
          ))}
        </div>

        {/* Speed & Duration Controls */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-mist flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Motion Speed
            </p>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {SPEEDS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSpeed(s.id)}
                  disabled={busy}
                  className={`btn-press touch rounded py-1.5 font-mono text-[11px] transition-all ${
                    busy ? "cursor-not-allowed opacity-60" : ""
                  } ${
                    speed === s.id ? "bg-chalk text-ink font-semibold" : "border border-chalk/15 text-mist hover:text-chalk"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-mist">Clip Duration</p>
            <div className="mt-2 flex gap-1.5">
              {LENGTHS.map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLength(l)}
                  disabled={busy}
                  className={`btn-press touch flex-1 rounded py-1.5 font-mono text-[11px] tabular-nums transition-all ${
                    busy ? "cursor-not-allowed opacity-60" : ""
                  } ${
                    length === l ? "bg-chalk text-ink font-semibold" : "border border-chalk/15 text-mist hover:text-chalk"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Aspect Ratio */}
        <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.16em] text-mist">Aspect Ratio / Layout</p>
        <div className="mt-2 flex gap-2">
          {RATIOS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRatio(r)}
              disabled={busy}
              className={`btn-press touch flex-1 rounded-md py-2 font-mono text-xs tabular-nums transition-all ${
                busy ? "cursor-not-allowed opacity-60" : ""
              } ${
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
            {busy ? `Directing with ${VIDEO_MODELS.find(m => m.id === model)?.name}…` : `Generate Clip (${VIDEO_MODELS.find(m => m.id === model)?.name})`}
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

        {videoUrl && (
          <PublishPanel kind="video" prompt={prompt} ratio={ratio === "2.39:1" ? "16:9" : ratio} motion={motion} length={length} />
        )}
      </div>

      {/* Video Cinema Viewport Column */}
      <div className="order-1 min-w-0 lg:order-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <p className="font-mono text-xs uppercase tracking-wider text-mist">
              Cinema Master Player · {ratio} Scope · {VIDEO_MODELS.find(m => m.id === model)?.name}
            </p>
            {videoUrl && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 font-mono text-[10px] text-emerald-400 font-semibold">
                <Film className="w-3 h-3" />
                60 FPS Directorial Motion Active
              </span>
            )}
          </div>

          {videoUrl && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={downloadVideo}
                disabled={isExporting}
                className="btn-press flex items-center gap-1.5 rounded bg-cobalt px-3 py-1.5 text-xs font-semibold text-chalk hover:bg-[#4A70FF] shadow disabled:opacity-50"
              >
                {isExporting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                {isExporting ? "Exporting Video…" : "Download Video"}
              </button>
              <button
                type="button"
                onClick={() => router.push("/studio")}
                className="btn-press flex items-center gap-1 rounded bg-white/10 px-2.5 py-1.5 text-xs text-chalk hover:bg-white/20"
              >
                <Clapperboard className="w-3 h-3" />
                Timeline
              </button>
            </div>
          )}
        </div>

        <div
          className={`relative overflow-hidden rounded-2xl border border-chalk/15 bg-slateink shadow-2xl ${
            ratio === "9:16"
              ? "mx-auto aspect-[9/16] max-w-[320px]"
              : ratio === "1:1"
              ? "aspect-square w-full max-w-[540px] mx-auto"
              : ratio === "2.39:1"
              ? "aspect-[2.39/1] w-full"
              : "aspect-video w-full"
          }`}
        >
          {videoUrl ? (
            <div className="relative h-full w-full bg-black group">
              {/* Directorial 60 FPS Canvas Motion Player */}
              <canvas
                ref={canvasRef}
                width={ratio === "9:16" ? 720 : ratio === "1:1" ? 1024 : 1280}
                height={ratio === "9:16" ? 1280 : ratio === "1:1" ? 1024 : 720}
                className="h-full w-full object-cover"
              />

              {/* Overlay Controls */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="btn-press rounded-full bg-white/20 p-2 text-chalk hover:bg-white/30 backdrop-blur"
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        startTimeRef.current = performance.now()
                        setCurrentTime(0)
                      }}
                      className="btn-press rounded-full bg-white/10 p-2 text-chalk hover:bg-white/20 backdrop-blur"
                      title="Rewind to start"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Progress Bar & Timecode */}
                  <div className="flex-1 mx-3">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/20">
                      <div
                        className="h-full bg-cobalt transition-all"
                        style={{ width: `${(currentTime / durationSeconds) * 100}%` }}
                      />
                    </div>
                  </div>

                  <span className="font-mono text-[11px] text-chalk font-semibold tabular-nums">
                    00:0{Math.floor(currentTime)} / 00:{durationSeconds < 10 ? `0${durationSeconds}` : durationSeconds}
                  </span>
                </div>
              </div>
            </div>
          ) : busy ? (
            <div className="relative h-full w-full flex flex-col items-center justify-center p-8 text-center bg-ink">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cobalt/20 text-cobalt mb-3 animate-spin">
                <RefreshCw className="h-7 w-7" />
              </div>
              <h3 className="font-display text-lg font-semibold text-chalk">Synthesizing {VIDEO_MODELS.find(m => m.id === model)?.name} Take</h3>
              <p className="text-xs text-cobalt font-mono animate-pulse mt-1">
                Executing {CAMERA_RIGS.find((r) => r.id === motion)?.label} camera trajectory and rendering diffusion stream…
              </p>
            </div>
          ) : (
            <div className="relative h-full w-full flex flex-col items-center justify-center p-8 text-center bg-ink">
              <div className="absolute inset-0 bg-gradient-to-br from-cobalt/20 via-ink to-saffron/10" />
              <div className="relative z-10 flex flex-col items-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-slateink/60 text-chalk mb-4 shadow-xl">
                  <VideoIcon className="h-7 w-7 text-mist" aria-hidden="true" />
                </div>
                <h3 className="font-display text-lg font-semibold text-chalk">Ready to Direct Cinema</h3>
                <p className="text-xs text-mist/70 max-w-[280px] mt-1.5">
                  Select your AI video model, camera motion rig, and prompt to synthesize your AI cinema clip.
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
