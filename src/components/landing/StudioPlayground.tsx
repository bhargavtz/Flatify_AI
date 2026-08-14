"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Sparkles, Sliders, Wand2, RefreshCw, Copy, Check, Download, Layers, Eye } from "lucide-react"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"

const STYLE_PRESETS = [
  { id: "cinema", label: "Cinematic 8K", promptSuffix: "8k volumetric lighting, cinematic color grade, anamorphic lens flare" },
  { id: "analog", label: "35mm Analog Film", promptSuffix: "kodak portra 400 film grain, soft natural highlights, vintage depth" },
  { id: "octane", label: "Octane 3D Render", promptSuffix: "octane render, metallic raytracing reflections, subsurface scattering" },
  { id: "flatify", label: "Flatify Vector SVG", promptSuffix: "clean flat geometric vector art, crisp lines, modern duotone color palette" },
]

export default function StudioPlayground() {
  const [prompt, setPrompt] = useState("A futuristic cybernetic tiger roaming a neon lotus sanctuary")
  const [selectedStyle, setSelectedStyle] = useState("cinema")
  const [aspectRatio, setAspectRatio] = useState("16:9")
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)

  const { user, isSignedIn } = useUser()
  const router = useRouter()

  const handleCopy = () => {
    navigator.clipboard.writeText(`${prompt}, ${STYLE_PRESETS.find(s => s.id === selectedStyle)?.promptSuffix}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSimulatedGenerate = () => {
    if (isSignedIn) {
      router.push("/generate")
      return
    }
    setIsGenerating(true)
    setTimeout(() => {
      setIsGenerating(false)
    }, 1200)
  }

  return (
    <section className="relative py-24 px-4 max-w-7xl mx-auto z-10">
      <div className="glass-card rounded-3xl p-8 md:p-12 border border-indigo-500/30 overflow-hidden relative">
        {/* Background Ambient Glows */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row gap-12 items-center">
          {/* Left Controls */}
          <div className="flex-1 space-y-6 w-full">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold uppercase tracking-wider border border-indigo-500/20">
              <Wand2 className="w-3.5 h-3.5" />
              Live Interactive Studio Sandbox
            </div>

            <h3 className="text-3xl md:text-5xl font-black text-white leading-tight">
              Test Drive <br />
              <span className="text-gradient">Studio Prompt Synthesizer</span>
            </h3>

            <p className="text-slate-400 text-sm md:text-base">
              Type your vision or apply studio aesthetic modifiers. Watch the real-time AI parameter compiler structure your prompt for studio rendering.
            </p>

            {/* Prompt Input Box */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Primary Prompt Core
              </label>
              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={3}
                  className="w-full rounded-2xl bg-slate-950/80 border border-white/10 p-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/80 resize-none transition-all"
                  placeholder="Describe anything imaginable..."
                />
              </div>
            </div>

            {/* Aesthetic Style Chips */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Aesthetic Style Presets
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {STYLE_PRESETS.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setSelectedStyle(style.id)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-medium border text-left transition-all ${
                      selectedStyle === style.id
                        ? "bg-indigo-600/30 border-indigo-400 text-white shadow-lg shadow-indigo-500/20"
                        : "bg-slate-900/60 border-white/5 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                    }`}
                  >
                    {style.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect Ratio & Controls */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Ratio:</span>
                {["16:9", "1:1", "9:16"].map((ratio) => (
                  <button
                    key={ratio}
                    onClick={() => setAspectRatio(ratio)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                      aspectRatio === ratio
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-900 text-slate-400 hover:text-white"
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="p-2.5 rounded-xl glass-panel text-slate-300 hover:text-white transition-colors"
                  title="Copy Prompt"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  onClick={handleSimulatedGenerate}
                  disabled={isGenerating}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-pink-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-indigo-500/25 hover:brightness-110 active:scale-95 transition-all"
                >
                  {isGenerating ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  Synthesize Render
                </button>
              </div>
            </div>
          </div>

          {/* Right Simulated Render Canvas */}
          <div className="flex-1 w-full relative">
            <div className="relative rounded-2xl overflow-hidden border border-white/10 glass-panel shadow-2xl group">
              <img
                src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80"
                alt="AI Generated Playground Output"
                className={`w-full h-[420px] object-cover transition-all duration-700 ${
                  isGenerating ? "scale-105 blur-sm opacity-60" : "scale-100 blur-0 opacity-100"
                }`}
              />

              {/* Overlay HUD */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-xs text-white/90 glass-panel px-3.5 py-2 rounded-lg backdrop-blur-md">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Flux.1 Engine Ready
                </span>
                <span>{aspectRatio} • 4K UHD</span>
              </div>

              {/* Bottom Details */}
              <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent">
                <p className="text-xs text-indigo-300 font-mono mb-1 uppercase tracking-wider">
                  Compiled Prompt Output
                </p>
                <p className="text-sm text-slate-200 line-clamp-2">
                  {prompt}, {STYLE_PRESETS.find((s) => s.id === selectedStyle)?.promptSuffix}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
