"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, Camera, Video, Box, Layers, ArrowUpRight, Cpu, Star } from "lucide-react"

const MODEL_CATEGORIES = [
  { id: "photo", label: "Studio Photography", icon: Camera, color: "from-blue-500 to-indigo-500" },
  { id: "video", label: "Cinema & Video AI", icon: Video, color: "from-purple-500 to-pink-500" },
  { id: "vector", label: "Vector & Flat Logos", icon: Layers, color: "from-emerald-400 to-teal-600" },
  { id: "3d", label: "3D Assets & Meshes", icon: Box, color: "from-amber-400 to-orange-500" },
]

const MODELS_DATA = [
  {
    category: "photo",
    name: "Flux.1 Ultra Realism",
    tag: "Studio Grade",
    resolution: "8K UHD Photo",
    speed: "1.2s",
    desc: "Unmatched hyper-realistic human skin textures, realistic lighting, and studio lens bokeh depth.",
    badge: "99.8% Accuracy",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
    prompt: "Vogue studio fashion portrait, 85mm f/1.4 lens, soft box volumetric lighting, 8k resolution"
  },
  {
    category: "photo",
    name: "Midjourney v6.1 Engine",
    tag: "Artistic Genius",
    resolution: "Photorealistic 4K",
    speed: "2.4s",
    desc: "Breathtaking aesthetic compositions, dramatic shadows, and film stock color science.",
    badge: "Community Choice",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80",
    prompt: "Cyberpunk urban detective, rainy neon reflective street, Hasselblad analog film texture"
  },
  {
    category: "video",
    name: "Sora Video Gen-2",
    tag: "60 FPS Cinema",
    resolution: "4K Motion HDR",
    speed: "8.0s",
    desc: "Physics-compliant fluid camera movements, multi-character temporal consistency.",
    badge: "Hollywood Ready",
    image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
    prompt: "Drone tracking shot flying through futuristic glass skyscraper canyon at sunset"
  },
  {
    category: "video",
    name: "Runway Gen-3 Alpha",
    tag: "Hyper Motion",
    resolution: "1080p 60fps",
    speed: "5.5s",
    desc: "Direct camera controls, pan, tilt, zoom, and prompt-steered cinematic lighting shifts.",
    badge: "Pro Director Choice",
    image: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80",
    prompt: "Macro close up of a glowing biomechanical robotic eye opening slowly"
  },
  {
    category: "vector",
    name: "Flatify Vector Pro 3.0",
    tag: "Infinite SVG",
    resolution: "Lossless Scalable",
    speed: "0.8s",
    desc: "Clean geometry, clean paths, zero unwanted artifacts. Ideal for brand logos & icons.",
    badge: "Vector Precision",
    image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
    prompt: "Minimalist flat geometric fox logo, vibrant dual-tone indigo & electric coral gradient"
  },
  {
    category: "3d",
    name: "Meshy 3D Engine",
    tag: "GLTF / OBJ Export",
    resolution: "High-Poly Mesh",
    speed: "4.0s",
    desc: "Instant text-to-3D model creation with PBR material maps and clean quad topology.",
    badge: "Game Engine Ready",
    image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=800&q=80",
    prompt: "Futuristic neon cyberpunk helmet, PBR roughness map, Octane render 3D asset"
  }
]

export default function ModelMatrix() {
  const [activeCategory, setActiveCategory] = useState("photo")
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const filteredModels = MODELS_DATA.filter((m) => m.category === activeCategory)

  return (
    <section className="relative py-28 px-4 max-w-7xl mx-auto z-10">
      {/* Section Header */}
      <div className="text-center mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel border-indigo-500/30 text-indigo-300 text-xs font-semibold tracking-wider uppercase mb-4"
        >
          <Cpu className="w-4 h-4 text-indigo-400" />
          The Multi-Model Matrix Architecture
        </motion.div>
        
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-6"
        >
          Every World-Class AI Model. <br />
          <span className="text-gradient-cyan">Unified in One Studio.</span>
        </motion.h2>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-slate-400 text-lg max-w-2xl mx-auto"
        >
          Switch seamlessly between top photography, cinema video, vector graphic, and 3D rendering engines with zero prompt loss.
        </motion.p>
      </div>

      {/* Category Nav Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
        {MODEL_CATEGORIES.map((cat) => {
          const Icon = cat.icon
          const isActive = activeCategory === cat.id
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`relative flex items-center gap-2.5 px-6 py-3.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                isActive
                  ? "text-white bg-indigo-600/80 shadow-lg shadow-indigo-500/25 border border-indigo-400/40"
                  : "text-slate-400 hover:text-white glass-panel hover:border-slate-700"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
              {cat.label}
              {isActive && (
                <motion.div
                  layoutId="activeTabGlow"
                  className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 blur-md opacity-30 -z-10"
                />
              )}
            </button>
          )
        })}
      </div>

      {/* Models Grid */}
      <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <AnimatePresence mode="wait">
          {filteredModels.map((model, idx) => (
            <motion.div
              key={model.name}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="group relative glass-card rounded-2xl p-6 overflow-hidden flex flex-col justify-between"
            >
              {/* Background Glow */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/25 transition-all duration-500" />

              <div>
                {/* Header info */}
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {model.tag}
                  </span>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span>{model.badge}</span>
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors flex items-center justify-between">
                  {model.name}
                  <ArrowUpRight className="w-5 h-5 text-slate-500 group-hover:text-indigo-400 transition-colors group-hover:translate-x-1 group-hover:-translate-y-1" />
                </h3>

                <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                  {model.desc}
                </p>

                {/* Preview Image Card */}
                <div className="relative h-48 rounded-xl overflow-hidden mb-6 border border-white/10 group-hover:border-indigo-500/40 transition-colors">
                  <img
                    src={model.image}
                    alt={model.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80" />
                  
                  <div className="absolute bottom-3 left-3 right-3 p-3 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-xs text-slate-300 truncate">
                    <span className="text-indigo-400 font-medium">Prompt:</span> &quot;{model.prompt}&quot;
                  </div>
                </div>
              </div>

              {/* Footer Meta */}
              <div className="flex items-center justify-between pt-4 border-t border-white/5 text-xs text-slate-400">
                <div>
                  <span className="text-slate-500">Output:</span> <strong className="text-white">{model.resolution}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Avg Speed:</span> <strong className="text-emerald-400">{model.speed}</strong>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </section>
  )
}
