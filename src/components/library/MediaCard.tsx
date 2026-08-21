"use client"

import { useState } from "react"
import {
  Copy,
  FolderPlus,
  Globe,
  Lock,
  Star,
  Download,
  Trash2,
  Check,
  Clapperboard,
  Sparkles,
} from "lucide-react"
import type { MediaItem } from "@/lib/user-storage"

export interface MediaCardProps {
  item: MediaItem
  onToggleFavorite: (id: string, isFav: boolean) => void
  onToggleVisibility: (id: string, currentVis: "public" | "private") => void
  onOpenBoardModal: (item: MediaItem) => void
  onDelete: (id: string) => void
  onMakeVideo?: (prompt: string, ratio: string) => void
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 MB"
  const mb = bytes / (1024 * 1024)
  if (mb < 1) return `${(bytes / 1024).toFixed(1)} KB`
  return `${mb.toFixed(1)} MB`
}

export default function MediaCard({
  item,
  onToggleFavorite,
  onToggleVisibility,
  onOpenBoardModal,
  onDelete,
  onMakeVideo,
}: MediaCardProps) {
  const [copied, setCopied] = useState(false)

  const copyPrompt = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(item.prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadFile = (e: React.MouseEvent) => {
    e.stopPropagation()
    const link = document.createElement("a")
    link.href = item.url
    link.download = `flatify_${item.kind}_${Date.now()}.${item.kind === "video" ? "mp4" : "jpg"}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="group relative break-inside-avoid overflow-hidden rounded-2xl border border-white/10 bg-slateink shadow-lg transition-all duration-300 hover:border-cobalt/50 hover:shadow-2xl mb-4">
      {/* Media Asset Preview */}
      <div
        className={`relative w-full overflow-hidden ${
          item.ratio === "9:16"
            ? "aspect-[9/16]"
            : item.ratio === "1:1"
            ? "aspect-square"
            : item.ratio === "4:3"
            ? "aspect-[4/3]"
            : "aspect-video"
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.url}
          alt={item.prompt}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />

        {/* Top Badges */}
        <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between pointer-events-none z-10">
          <span className="flex items-center gap-1 rounded-md bg-black/70 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-chalk backdrop-blur">
            {item.kind === "video" ? <Clapperboard className="h-3 w-3 text-saffron" /> : <Sparkles className="h-3 w-3 text-cobalt" />}
            {item.ratio}
          </span>

          <div className="flex items-center gap-1 pointer-events-auto">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onToggleVisibility(item._id, item.visibility)
              }}
              className="btn-press rounded-md bg-black/70 p-1.5 text-mist backdrop-blur hover:text-chalk"
              title={item.visibility === "public" ? "Public on Pinterest" : "Private to you"}
            >
              {item.visibility === "public" ? (
                <Globe className="h-3.5 w-3.5 text-cobalt" />
              ) : (
                <Lock className="h-3.5 w-3.5" />
              )}
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onToggleFavorite(item._id, item.isFavorite)
              }}
              className="btn-press rounded-md bg-black/70 p-1.5 backdrop-blur hover:text-saffron"
              title={item.isFavorite ? "Favorited" : "Favorite"}
            >
              <Star
                className={`h-3.5 w-3.5 ${
                  item.isFavorite ? "fill-saffron text-saffron" : "text-mist hover:text-chalk"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Hover Prompt Overlay Card */}
        <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-ink/95 via-ink/80 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100 backdrop-blur-[2px]">
          {/* Top spacer for badge visibility */}
          <div className="h-6" />

          {/* Center/Bottom Prompt Content */}
          <div className="space-y-2">
            <p className="line-clamp-4 text-xs font-medium leading-relaxed text-chalk drop-shadow">
              {item.prompt}
            </p>

            <div className="flex items-center justify-between text-[10px] font-mono text-mist">
              <span>{formatBytes(item.sizeBytes)}</span>
              <span>{new Date(item.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Quick Action Toolbar */}
          <div className="flex items-center justify-between border-t border-white/10 pt-2.5 mt-2">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={copyPrompt}
                className="btn-press flex items-center gap-1 rounded-md bg-white/10 px-2 py-1 text-[11px] font-semibold text-chalk hover:bg-white/20 backdrop-blur"
                title="Copy Prompt"
              >
                {copied ? <Check className="h-3 w-3 text-saffron" /> : <Copy className="h-3 w-3" />}
                {copied ? "Copied" : "Prompt"}
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onOpenBoardModal(item)
                }}
                className="btn-press flex items-center gap-1 rounded-md bg-white/10 px-2 py-1 text-[11px] font-semibold text-chalk hover:bg-white/20 backdrop-blur"
                title="Save to Board"
              >
                <FolderPlus className="h-3 w-3" />
                Board
              </button>
            </div>

            <div className="flex items-center gap-1">
              {item.kind === "image" && onMakeVideo && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onMakeVideo(item.prompt, item.ratio)
                  }}
                  className="btn-press rounded-md bg-cobalt/80 p-1.5 text-chalk hover:bg-cobalt"
                  title="Make Video from Prompt"
                >
                  <Clapperboard className="h-3.5 w-3.5" />
                </button>
              )}

              <button
                type="button"
                onClick={downloadFile}
                className="btn-press rounded-md bg-white/10 p-1.5 text-chalk hover:bg-white/20"
                title="Download file"
              >
                <Download className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(item._id)
                }}
                className="btn-press rounded-md bg-coral/20 p-1.5 text-coral hover:bg-coral/40"
                title="Move to 30-Day Trash"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
