"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { Image as ImageIcon, Clapperboard, RefreshCw } from "lucide-react"

type ClipKind = "still" | "clip"

interface Clip {
  id: string
  kind: ClipKind
  label: string
}

const STARTER: Clip[] = [
  { id: "1", kind: "still", label: "Still · street" },
  { id: "2", kind: "clip", label: "Clip · 8s pan" },
  { id: "3", kind: "still", label: "Still · interior" },
]

const CUTS = [
  { id: "hard", label: "Hard cut" },
  { id: "dissolve", label: "Dissolve" },
  { id: "hold", label: "Hold frame" },
]

export default function CutDesk() {
  const [clips, setClips] = useState<Clip[]>(STARTER)
  const [cut, setCut] = useState("hard")
  const [busy, setBusy] = useState(false)
  const { isSignedIn } = useUser()
  const router = useRouter()

  const add = (kind: ClipKind) => {
    const n = clips.length + 1
    setClips((prev) => [
      ...prev,
      {
        id: String(n),
        kind,
        label: kind === "still" ? `Still · take ${n}` : `Clip · ${n}`,
      },
    ])
  }

  const remove = (id: string) => {
    setClips((prev) => (prev.length > 1 ? prev.filter((c) => c.id !== id) : prev))
  }

  const run = () => {
    if (!isSignedIn) {
      router.push("/signup")
      return
    }
    setBusy(true)
    setTimeout(() => setBusy(false), 1600)
  }

  return (
    <div className="page-max page-pad min-w-0 pt-[calc(var(--header-offset)+2rem)] lg:pt-[calc(var(--header-offset)+3rem)]">
      <div className="max-w-xl">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-saffron">Cut desk</p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-chalk text-balance md:text-5xl">
          Image into film.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-mist">
          Lay stills and clips on one timeline. Merge them. Export a video that holds.
        </p>
      </div>

      <div className="mt-10 overflow-hidden border border-chalk/10 bg-slateink">
        <div className="relative aspect-video bg-ink">
          <div className="absolute inset-0 grid grid-cols-3">
            {clips.slice(0, 3).map((clip) => (
              <div
                key={clip.id}
                className={`flex items-end border-r border-chalk/10 p-4 last:border-r-0 ${
                  clip.kind === "still" ? "bg-cobalt/30" : "bg-saffron/20"
                }`}
              >
                <span className="truncate font-mono text-[10px] uppercase tracking-wider text-chalk">{clip.label}</span>
              </div>
            ))}
          </div>
          {busy ? (
            <p className="absolute inset-0 flex items-center justify-center bg-ink/50 font-mono text-xs uppercase tracking-wider text-chalk">
              Cutting…
            </p>
          ) : null}
        </div>

        <div className="border-t border-chalk/10 p-4 sm:p-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-mist">Timeline</p>
          <ol className="mt-3 flex gap-2 overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch]">
            {clips.map((clip, i) => (
              <li key={clip.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => remove(clip.id)}
                  className="btn-press flex w-[7.5rem] flex-col gap-2 border border-chalk/15 bg-ink p-3 text-left"
                  aria-label={`Remove ${clip.label}`}
                >
                  {clip.kind === "still" ? (
                    <ImageIcon className="h-4 w-4 text-cobalt" aria-hidden="true" />
                  ) : (
                    <Clapperboard className="h-4 w-4 text-saffron" aria-hidden="true" />
                  )}
                  <span className="font-mono text-[10px] text-mist">0{i + 1}</span>
                  <span className="truncate text-xs text-chalk">{clip.label}</span>
                </button>
              </li>
            ))}
          </ol>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => add("still")}
              className="btn-press touch flex-1 rounded-md border border-chalk/15 text-sm font-semibold text-chalk hover:border-chalk/40"
            >
              Add still
            </button>
            <button
              type="button"
              onClick={() => add("clip")}
              className="btn-press touch flex-1 rounded-md border border-chalk/15 text-sm font-semibold text-chalk hover:border-chalk/40"
            >
              Add clip
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_16rem] lg:items-end">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-mist">Join</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {CUTS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCut(c.id)}
                className={`btn-press touch rounded-md px-4 text-sm font-medium ${
                  cut === c.id ? "bg-chalk text-ink" : "border border-chalk/15 text-mist hover:text-chalk"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={run}
          disabled={busy}
          className="btn-press flex w-full touch items-center justify-center gap-2 rounded-md bg-cobalt px-6 text-sm font-semibold text-chalk hover:bg-[#4A70FF] disabled:opacity-70"
        >
          {busy ? <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
          {busy ? "Merging…" : isSignedIn ? "Export video" : "Sign in to export"}
        </button>
      </div>
    </div>
  )
}
