"use client"

import { useState } from "react"
import { Check, Copy, RefreshCw } from "lucide-react"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"

const STYLE_PRESETS = [
  { id: "flatify", label: "Flat vector", promptSuffix: "clean geometric vector, hard edges, two-color field" },
  { id: "cinema", label: "Studio still", promptSuffix: "controlled lighting, held color, no haze" },
  { id: "analog", label: "Print grain", promptSuffix: "paper tooth, ink density, slight misregistration" },
  { id: "octane", label: "Object render", promptSuffix: "solid materials, sharp shadow, product stand" },
]

export default function StudioPlayground() {
  const [prompt, setPrompt] = useState("A fox mark, two planes, cobalt and saffron")
  const [selectedStyle, setSelectedStyle] = useState("flatify")
  const [aspectRatio, setAspectRatio] = useState("1:1")
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const { isSignedIn } = useUser()
  const router = useRouter()

  const compiled = `${prompt}, ${STYLE_PRESETS.find((s) => s.id === selectedStyle)?.promptSuffix}`

  const handleCopy = async () => {
    await navigator.clipboard.writeText(compiled)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleGenerate = () => {
    if (isSignedIn) {
      router.push("/generate")
      return
    }
    setIsGenerating(true)
    setTimeout(() => setIsGenerating(false), 1100)
  }

  return (
    <section className="border-y border-chalk/10 bg-slateink">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-24 md:grid-cols-2 md:px-8">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-saffron">The bench</p>
          <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight text-chalk text-balance md:text-5xl">
            Write it. Hold it.
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-mist">
            A prompt is a brief. Style is a paper stock. Generate when you’re ready — guests can try the bench; accounts take the file.
          </p>

          <label htmlFor="studio-prompt" className="mt-8 block font-mono text-[11px] uppercase tracking-[0.16em] text-mist">
            Brief
          </label>
          <textarea
            id="studio-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            spellCheck={false}
            autoComplete="off"
            placeholder="A fox mark, two planes…"
            className="mt-2 w-full resize-none rounded-md border border-chalk/15 bg-ink p-4 text-sm text-chalk placeholder:text-mist/50 focus-visible:border-cobalt"
          />

          <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.16em] text-mist">Paper</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {STYLE_PRESETS.map((style) => (
              <button
                key={style.id}
                type="button"
                onClick={() => setSelectedStyle(style.id)}
                className={`btn-press min-h-11 rounded-md px-3 text-left text-sm font-medium transition-colors duration-200 ease-out ${
                  selectedStyle === style.id
                    ? "bg-chalk text-ink"
                    : "border border-chalk/15 text-mist hover:text-chalk"
                }`}
              >
                {style.label}
              </button>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1" role="group" aria-label="Aspect ratio">
              {["1:1", "16:9", "9:16"].map((ratio) => (
                <button
                  key={ratio}
                  type="button"
                  onClick={() => setAspectRatio(ratio)}
                  className={`btn-press min-h-10 rounded-md px-3 font-mono text-xs tabular-nums transition-colors duration-200 ease-out ${
                    aspectRatio === ratio ? "bg-cobalt text-chalk" : "text-mist hover:text-chalk"
                  }`}
                >
                  {ratio}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="btn-press inline-flex min-h-11 items-center gap-2 rounded-md border border-chalk/15 px-3 text-sm text-chalk"
                aria-label="Copy compiled brief"
              >
                {copied ? <Check className="h-4 w-4 text-saffron" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
                {copied ? "Copied" : "Copy"}
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="btn-press inline-flex min-h-11 items-center gap-2 rounded-md bg-cobalt px-5 text-sm font-semibold text-chalk hover:bg-[#4A70FF] disabled:opacity-70"
              >
                {isGenerating ? (
                  <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : null}
                {isGenerating ? "Drawing…" : isSignedIn ? "Open generate" : "Try the bench"}
              </button>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden border border-chalk/10 bg-ink">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80"
            alt="Sample geometric composition from the bench"
            width={1200}
            height={800}
            className={`h-[380px] w-full object-cover transition-[filter,opacity,transform] duration-500 ease-out md:h-full md:min-h-[420px] ${
              isGenerating ? "scale-[1.03] opacity-60 blur-[2px]" : "scale-100 opacity-100"
            }`}
          />
          <div className="absolute inset-x-0 bottom-0 bg-ink/80 p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-saffron">
              {aspectRatio} · compiled
            </p>
            <p className="mt-2 line-clamp-2 text-sm text-chalk">{compiled}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
