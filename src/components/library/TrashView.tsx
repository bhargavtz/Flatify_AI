"use client"

import { useState, useEffect } from "react"
import { Trash2, RotateCcw, ShieldCheck, RefreshCw } from "lucide-react"
import type { MediaItem } from "@/lib/user-storage"

export interface TrashedMediaItem extends MediaItem {
  daysRemaining: number
}

export default function TrashView({ onRestored }: { onRestored: () => void }) {
  const [items, setItems] = useState<TrashedMediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function fetchTrash() {
      try {
        const res = await fetch("/api/media/trash")
        const json = await res.json()
        if (active && json.ok) {
          setItems(json.items || [])
        }
      } catch {
        /* ignore */
      } finally {
        if (active) setLoading(false)
      }
    }

    fetchTrash()
    return () => {
      active = false
    }
  }, [])

  const handleRestore = async (mediaId: string) => {
    setBusyId(mediaId)
    try {
      const res = await fetch("/api/media/trash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restore", mediaId }),
      })
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i._id !== mediaId))
        onRestored()
      }
    } catch {
      /* ignore */
    } finally {
      setBusyId(null)
    }
  }

  const handlePurge = async (mediaId: string) => {
    setBusyId(mediaId)
    try {
      const res = await fetch("/api/media/trash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "purge", mediaId }),
      })
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i._id !== mediaId))
        onRestored()
      }
    } catch {
      /* ignore */
    } finally {
      setBusyId(null)
    }
  }

  const handleEmptyTrash = async () => {
    if (!confirm("Are you sure you want to permanently delete all items in trash?")) return
    setLoading(true)
    try {
      const res = await fetch("/api/media/trash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "empty" }),
      })
      if (res.ok) {
        setItems([])
        onRestored()
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 30-Day Policy Alert Box */}
      <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-slateink/80 p-5 text-mist md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 shrink-0 text-cobalt mt-0.5" />
          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-chalk">30-Day Backup & Recovery Guarantee</p>
            <p className="text-xs text-mist">
              Deleted creations are backed up for 30 days before permanent deletion. You can restore any prompt and image at any time.
            </p>
          </div>
        </div>

        {items.length > 0 && (
          <button
            type="button"
            onClick={handleEmptyTrash}
            className="btn-press flex items-center justify-center gap-1.5 rounded-lg bg-coral/20 px-4 py-2 text-xs font-semibold text-coral hover:bg-coral/30 shrink-0"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Empty Trash Now
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="h-6 w-6 animate-spin text-mist" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 py-16 text-center">
          <Trash2 className="h-10 w-10 text-mist/40 mb-3" />
          <p className="text-sm font-semibold text-chalk">Trash is Empty</p>
          <p className="text-xs text-mist mt-1">Items you delete will be safely kept here for 30 days.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div
              key={item._id}
              className="overflow-hidden rounded-2xl border border-white/10 bg-slateink shadow-lg"
            >
              <div className="relative aspect-video w-full overflow-hidden bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.url} alt={item.prompt} className="h-full w-full object-cover opacity-80" />
                <span className="absolute top-2 right-2 rounded-md bg-black/80 px-2 py-0.5 font-mono text-[10px] text-saffron backdrop-blur">
                  Expires in {item.daysRemaining} {item.daysRemaining === 1 ? "day" : "days"}
                </span>
              </div>

              <div className="p-4 space-y-3">
                <p className="line-clamp-2 text-xs text-chalk">{item.prompt}</p>

                <div className="flex items-center justify-between border-t border-white/10 pt-3">
                  <button
                    type="button"
                    onClick={() => handleRestore(item._id)}
                    disabled={busyId === item._id}
                    className="btn-press flex items-center gap-1.5 rounded-lg bg-cobalt px-3 py-1.5 text-xs font-semibold text-chalk hover:bg-[#4A70FF] disabled:opacity-50"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Restore
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePurge(item._id)}
                    disabled={busyId === item._id}
                    className="btn-press text-xs text-coral hover:underline"
                  >
                    Delete Forever
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
