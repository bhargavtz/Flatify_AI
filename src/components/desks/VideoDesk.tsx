"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { Play, RefreshCw } from "lucide-react"
import PublishPanel from "@/components/explore/PublishPanel"

const LENGTHS = ["4s", "8s", "12s"] as const
const MOTIONS = [
  { id: "lock", label: "Locked cam" },
  { id: "pan", label: "Slow pan" },
  { id: "push", label: "Push in" },
  { id: "orbit", label: "Orbit" },
]
const RATIOS = ["16:9", "9:16"] as const

export default function VideoDesk() {
  const [prompt, setPrompt] = useState("A train window at night, reflections sliding, one amber interior light")
  const [length, setLength] = useState<(typeof LENGTHS)[number]>("8s")
  const [motion, setMotion] = useState("pan")
  const [ratio, setRatio] = useState<(typeof RATIOS)[number]>("16:9")
  const [busy, setBusy] = useState(false)
  const [ready, setReady] = useState(false)
  const [note, setNote] = useState("")
  const { isSignedIn } = useUser()
  const router = useRouter()

  useEffect(() => {
    const fromWall = new URLSearchParams(window.location.search).get("prompt")
    if (fromWall) setPrompt(fromWall)
  }, [])

  const run = async () => {
    if (!isSignedIn) {
      router.push("/signup")
      return
    }
    setBusy(true)
    setReady(false)
    setNote("")
    try {
      const res = await fetch("/api/studio/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "video", prompt }),
      })
      const json = (await res.json()) as { error?: string }
      if (!res.ok) {
        setNote(json.error ?? "Could not generate.")
        return
      }
      setReady(true)
    } catch {
      setNote("Could not generate.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page-max page-pad grid min-w-0 gap-8 pt-[calc(var(--header-offset)+2rem)] lg:grid-cols-[minmax(0,22rem)_1fr] lg:gap-12 lg:pt-[calc(var(--header-offset)+3rem)]">
      <div className="order-2 min-w-0 lg:order-1">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-saffron">Video desk</p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-chalk text-balance md:text-5xl">
          Move the frame.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-mist">
          A clip with a camera, not a loop of sparks. Length, motion, then the take.
        </p>

        <label htmlFor="video-brief" className="mt-8 block font-mono text-[11px] uppercase tracking-[0.16em] text-mist">
          Brief
        </label>
        <textarea
          id="video-brief"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          spellCheck={false}
          autoComplete="off"
          placeholder="A train window at night…"
          className="mt-2 w-full resize-none rounded-md border border-chalk/15 bg-slateink p-4 text-sm text-chalk placeholder:text-mist/50"
        />

        <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.16em] text-mist">Length</p>
        <div className="mt-2 flex gap-2" role="group" aria-label="Clip length">
          {LENGTHS.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLength(l)}
              className={`btn-press touch flex-1 rounded-md font-mono text-xs tabular-nums ${
                length === l ? "bg-chalk text-ink" : "border border-chalk/15 text-mist hover:text-chalk"
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.16em] text-mist">Camera</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {MOTIONS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMotion(m.id)}
              className={`btn-press touch rounded-md px-3 text-left text-sm font-medium ${
                motion === m.id ? "bg-chalk text-ink" : "border border-chalk/15 text-mist hover:text-chalk"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.16em] text-mist">Ratio</p>
        <div className="mt-2 flex gap-2">
          {RATIOS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRatio(r)}
              className={`btn-press touch flex-1 rounded-md font-mono text-xs tabular-nums ${
                ratio === r ? "bg-cobalt text-chalk" : "border border-chalk/15 text-mist hover:text-chalk"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={run}
          disabled={busy}
          className="btn-press mt-8 flex w-full touch items-center justify-center gap-2 rounded-md bg-cobalt px-6 text-sm font-semibold text-chalk hover:bg-[#4A70FF] disabled:opacity-70"
        >
          {busy ? <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
          {busy ? "Rolling…" : isSignedIn ? "Generate clip" : "Sign in to generate"}
        </button>
        {note ? <p className="mt-3 text-sm text-coral">{note}</p> : null}
        {ready ? (
          <PublishPanel kind="video" prompt={prompt} ratio={ratio} motion={motion} length={length} />
        ) : null}
      </div>

      <div className="order-1 min-w-0 lg:order-2">
        <div
          className={`relative overflow-hidden border border-chalk/10 bg-slateink ${
            ratio === "9:16" ? "mx-auto aspect-[9/16] max-w-[280px] sm:max-w-[320px]" : "aspect-video w-full"
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-cobalt/40 via-ink to-saffron/20" />
          <div className="absolute inset-x-8 top-1/3 h-px bg-chalk/20" />
          <div className="absolute inset-y-10 left-1/4 w-px bg-chalk/10" />
          <button
            type="button"
            className="btn-press absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-chalk text-ink"
            aria-label="Preview play"
          >
            <Play className="h-5 w-5 translate-x-0.5" aria-hidden="true" />
          </button>
          <div className="absolute inset-x-4 bottom-4">
            <div className="h-0.5 overflow-hidden bg-chalk/20">
              <div className={`h-full bg-saffron ${busy ? "w-2/3" : "w-1/5"}`} />
            </div>
            <div className="mt-2 flex justify-between font-mono text-[10px] uppercase tracking-wider text-chalk/80">
              <span>{length}</span>
              <span>{MOTIONS.find((m) => m.id === motion)?.label}</span>
            </div>
          </div>
        </div>
        <p className="mt-4 line-clamp-2 font-mono text-[11px] text-mist">{prompt}</p>
      </div>
    </div>
  )
}
