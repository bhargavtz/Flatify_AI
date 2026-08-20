"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { RefreshCw } from "lucide-react"
import PublishPanel from "@/components/explore/PublishPanel"

const RATIOS = ["1:1", "16:9", "4:3", "9:16"] as const
const PAPERS = [
  { id: "held", label: "Held light" },
  { id: "night", label: "Night street" },
  { id: "studio", label: "Studio pack" },
  { id: "film", label: "Print grain" },
]

const DEFAULT_FRAMES = [
  { id: "a", bg: "bg-cobalt", shift: "translate-x-2" },
  { id: "b", bg: "bg-saffron", shift: "-translate-x-1" },
  { id: "c", bg: "bg-coral", shift: "translate-y-1" },
  { id: "d", bg: "bg-chalk", shift: "" },
]

export default function ImageDesk() {
  const [prompt, setPrompt] = useState("A wet street at dusk, sodium lamps, one figure in a cobalt coat")
  const [ratio, setRatio] = useState<(typeof RATIOS)[number]>("16:9")
  const [paper, setPaper] = useState("held")
  const [busy, setBusy] = useState(false)
  const [ready, setReady] = useState(false)
  const [generatedImages, setGeneratedImages] = useState<string[]>([])
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
        body: JSON.stringify({ kind: "image", prompt, ratio }),
      })
      const json = (await res.json()) as { error?: string; images?: string[]; imageUrl?: string }
      if (!res.ok) {
        setNote(json.error ?? "Could not generate.")
        return
      }
      if (json.images && json.images.length > 0) {
        setGeneratedImages(json.images)
      } else if (json.imageUrl) {
        setGeneratedImages([json.imageUrl])
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
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-saffron">Image desk</p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-chalk text-balance md:text-5xl">
          Draw a still.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-mist">
          Write the frame. Pick a paper. The desk holds light — not a swarm.
        </p>

        <label htmlFor="image-brief" className="mt-8 block font-mono text-[11px] uppercase tracking-[0.16em] text-mist">
          Brief
        </label>
        <textarea
          id="image-brief"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          spellCheck={false}
          autoComplete="off"
          placeholder="A wet street at dusk…"
          className="mt-2 w-full resize-none rounded-md border border-chalk/15 bg-slateink p-4 text-sm text-chalk placeholder:text-mist/50"
        />

        <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.16em] text-mist">Ratio</p>
        <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Aspect ratio">
          {RATIOS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRatio(r)}
              className={`btn-press touch rounded-md px-3 font-mono text-xs tabular-nums ${
                ratio === r ? "bg-chalk text-ink" : "border border-chalk/15 text-mist hover:text-chalk"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.16em] text-mist">Paper</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {PAPERS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPaper(p.id)}
              className={`btn-press touch rounded-md px-3 text-left text-sm font-medium ${
                paper === p.id ? "bg-chalk text-ink" : "border border-chalk/15 text-mist hover:text-chalk"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={run}
          disabled={busy}
          className="btn-press mt-8 flex w-full touch items-center justify-center gap-2 rounded-md bg-cobalt px-6 text-sm font-semibold text-chalk hover:bg-[#4A70FF] disabled:opacity-70 lg:sticky lg:bottom-6"
        >
          {busy ? <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
          {busy ? "Holding the frame…" : isSignedIn ? "Generate still" : "Sign in to generate"}
        </button>
        {note ? <p className="mt-3 text-sm text-coral">{note}</p> : null}
        {ready ? (
          <PublishPanel kind="image" prompt={prompt} ratio={ratio} paper={paper} />
        ) : null}
      </div>

      <div className="order-1 min-w-0 lg:order-2">
        <div
          className={`grid gap-3 ${ratio === "9:16" ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2"}`}
          aria-busy={busy}
        >
          {(generatedImages.length > 0 ? generatedImages : DEFAULT_FRAMES).map((item, i) => {
            const isGenerated = typeof item === "string"
            return (
              <div
                key={isGenerated ? item : item.id}
                className={`relative overflow-hidden rounded-md border border-chalk/10 ${
                  ratio === "1:1" ? "aspect-square" : ratio === "9:16" ? "aspect-[9/16]" : ratio === "4:3" ? "aspect-[4/3]" : "aspect-video"
                } ${isGenerated ? "bg-slateink" : item.bg} ${busy ? "opacity-60" : ""}`}
              >
                {isGenerated ? (
                  <img
                    src={item}
                    alt={`Take 0${i + 1}`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className={`absolute inset-8 border border-ink/20 ${item.shift}`} />
                )}
                <span className="absolute left-3 top-3 rounded bg-ink/60 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-chalk">
                  Take 0{i + 1}
                </span>
              </div>
            )
          })}
        </div>
        <p className="mt-4 line-clamp-2 font-mono text-[11px] text-mist">
          {prompt} · {ratio} · {PAPERS.find((p) => p.id === paper)?.label}
        </p>
      </div>
    </div>
  )
}
