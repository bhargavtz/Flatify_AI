"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Camera, Video, Box, Layers, ArrowUpRight } from "lucide-react"

const MODEL_CATEGORIES = [
  { id: "photo", label: "Photography", icon: Camera },
  { id: "video", label: "Motion", icon: Video },
  { id: "vector", label: "Vector", icon: Layers },
  { id: "3d", label: "Mesh", icon: Box },
]

const MODELS_DATA = [
  {
    category: "photo",
    name: "Flux.1 Ultra",
    tag: "Studio still",
    resolution: "8K",
    speed: "1.2s",
    desc: "Skin, light, and lens that hold up on a poster. Not a filter.",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
    prompt: "Studio portrait, 85mm, soft box, held color",
  },
  {
    category: "photo",
    name: "Midjourney v6.1",
    tag: "Art direction",
    resolution: "4K",
    speed: "2.4s",
    desc: "Composition and film color when you need atmosphere, not a product shot.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80",
    prompt: "Night street, wet asphalt, analog grain",
  },
  {
    category: "video",
    name: "Sora Gen-2",
    tag: "Cinema",
    resolution: "4K HDR",
    speed: "8.0s",
    desc: "Camera that obeys physics. Characters that stay themselves across frames.",
    image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
    prompt: "Tracking shot through glass towers at dusk",
  },
  {
    category: "video",
    name: "Runway Gen-3",
    tag: "Steer",
    resolution: "1080p 60",
    speed: "5.5s",
    desc: "Pan, tilt, zoom — directed, not guessed.",
    image: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80",
    prompt: "Macro of a mechanical iris opening",
  },
  {
    category: "vector",
    name: "Flatify Vector",
    tag: "The point",
    resolution: "SVG",
    speed: "0.8s",
    desc: "Planes, nodes, no mush. Built for marks, icons, and brand sheets.",
    image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
    prompt: "Geometric fox, two-color, hard edges",
  },
  {
    category: "3d",
    name: "Meshy",
    tag: "Object",
    resolution: "GLTF / OBJ",
    speed: "4.0s",
    desc: "A mesh you can drop in a scene. PBR maps included.",
    image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=800&q=80",
    prompt: "Helmet, roughness map, studio light",
  },
]

export default function ModelMatrix() {
  const [activeCategory, setActiveCategory] = useState("vector")
  const filteredModels = MODELS_DATA.filter((m) => m.category === activeCategory)

  return (
    <section className="mx-auto max-w-6xl px-5 py-24 md:px-8">
      <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-saffron">Work on the wall</p>
          <h2 className="mt-4 max-w-lg font-display text-4xl font-semibold tracking-tight text-chalk text-balance md:text-5xl">
            Engines, treated as tools.
          </h2>
        </div>
        <p className="max-w-sm text-sm leading-relaxed text-mist">
          Photography, motion, vector, mesh — pick a desk, not a galaxy of glowing orbs.
        </p>
      </div>

      <div className="mt-10 flex flex-wrap gap-2" role="tablist" aria-label="Engine type">
        {MODEL_CATEGORIES.map((cat) => {
          const Icon = cat.icon
          const isActive = activeCategory === cat.id
          return (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveCategory(cat.id)}
              className={`btn-press inline-flex min-h-11 items-center gap-2 rounded-md px-4 text-sm font-semibold transition-colors duration-200 ease-out ${
                isActive ? "bg-chalk text-ink" : "border border-chalk/15 text-mist hover:text-chalk"
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {cat.label}
            </button>
          )
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
          className="mt-10 grid gap-6 md:grid-cols-2"
        >
          {filteredModels.map((model) => (
            <article
              key={model.name}
              className="group overflow-hidden border border-chalk/10 bg-slateink"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={model.image}
                  alt=""
                  width={800}
                  height={500}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                />
                <span className="absolute left-4 top-4 bg-ink/80 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-chalk">
                  {model.tag}
                </span>
              </div>
              <div className="p-6">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-display text-2xl font-semibold text-chalk">{model.name}</h3>
                  <ArrowUpRight className="h-5 w-5 text-mist transition-transform duration-200 ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
                </div>
                <p className="mt-2 text-sm leading-relaxed text-mist">{model.desc}</p>
                <p className="mt-4 truncate font-mono text-[11px] text-mist/80">“{model.prompt}”</p>
                <div className="mt-5 flex justify-between border-t border-chalk/10 pt-4 font-mono text-[11px] tabular-nums text-mist">
                  <span>Out {model.resolution}</span>
                  <span>{model.speed}</span>
                </div>
              </div>
            </article>
          ))}
        </motion.div>
      </AnimatePresence>
    </section>
  )
}
