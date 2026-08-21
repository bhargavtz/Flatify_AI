"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useUser } from "@clerk/nextjs"
import { Sparkles, Clapperboard, FolderHeart, ArrowUpRight, Image as ImageIcon } from "lucide-react"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import StorageMeter from "@/components/library/StorageMeter"
import type { MediaItem, UserStorageQuota } from "@/lib/user-storage"
import { Button } from "@/components/ui/button"

export default function DashboardPage() {
  const { user, isLoaded, isSignedIn } = useUser()

  const [items, setItems] = useState<MediaItem[]>([])
  const [quota, setQuota] = useState<UserStorageQuota | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function loadDashboard() {
      setLoading(true)
      try {
        const [mediaRes, quotaRes] = await Promise.all([
          fetch("/api/media?limit=12"),
          fetch("/api/storage/quota"),
        ])

        const mediaJson = await mediaRes.json()
        const quotaJson = await quotaRes.json()

        if (active) {
          if (mediaJson.ok) setItems(mediaJson.items || [])
          if (quotaJson.ok) setQuota(quotaJson.quota)
        }
      } catch {
        /* ignore */
      } finally {
        if (active) setLoading(false)
      }
    }

    if (isLoaded && isSignedIn) {
      loadDashboard()
    } else if (isLoaded && !isSignedIn) {
      queueMicrotask(() => {
        if (active) setLoading(false)
      })
    }

    return () => {
      active = false
    }
  }, [isLoaded, isSignedIn])

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center p-4">
        <LoadingSpinner size="xl" />
      </div>
    )
  }

  const imagesCount = items.filter((i) => i.kind === "image").length
  const videosCount = items.filter((i) => i.kind === "video").length

  return (
    <div className="relative min-h-dvh min-w-0 overflow-x-hidden bg-ink p-4 text-chalk selection:bg-cobalt selection:text-chalk sm:p-8 pt-[calc(var(--header-offset)+1.5rem)]">
      <div className="grain" />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        {/* Welcome Banner */}
        <div className="glass-card flex flex-col items-start justify-between gap-6 rounded-3xl border border-white/10 p-6 md:flex-row md:items-center md:p-8">
          <div className="min-w-0 space-y-2">
            <div className="inline-flex items-center gap-2 rounded-md border border-cobalt/30 bg-cobalt/15 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-saffron">
              <Sparkles className="w-3.5 h-3.5 text-saffron" />
              Creative Studio Dashboard
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight text-balance">
              Welcome back, <span className="text-saffron">{user?.firstName || "Creator"}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Manage your AI stills, video clips, creative library, and 500 MB cloud storage quota.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <Link href="/images" className="flex-1 md:flex-initial">
              <Button className="btn-press flex w-full items-center justify-center gap-2 rounded-md bg-cobalt px-5 py-5 text-xs font-semibold text-chalk hover:bg-[#4A70FF]">
                <ImageIcon className="w-4 h-4" />
                <span>Draw a Still</span>
                <ArrowUpRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/video" className="flex-1 md:flex-initial">
              <Button className="btn-press flex w-full items-center justify-center gap-2 rounded-md border border-white/15 bg-white/5 px-5 py-5 text-xs font-semibold text-chalk hover:bg-white/10">
                <Clapperboard className="w-4 h-4 text-saffron" />
                <span>Direct Motion</span>
                <ArrowUpRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Storage Meter & Quick Stats */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {quota && <StorageMeter quota={quota} />}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card p-5 rounded-2xl border border-white/10 flex flex-col justify-between">
              <span className="font-mono text-xs text-mist">AI Stills</span>
              <span className="text-3xl font-black text-chalk">{imagesCount}</span>
            </div>
            <div className="glass-card p-5 rounded-2xl border border-white/10 flex flex-col justify-between">
              <span className="font-mono text-xs text-mist">AI Clips</span>
              <span className="text-3xl font-black text-saffron">{videosCount}</span>
            </div>
            <Link
              href="/library"
              className="col-span-2 glass-card p-4 rounded-2xl border border-white/10 hover:border-cobalt transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <FolderHeart className="w-5 h-5 text-cobalt" />
                <div>
                  <p className="text-xs font-semibold text-chalk">Open Creative Library</p>
                  <p className="text-[11px] text-mist">View Pinterest boards & 30-day trash</p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-mist" />
            </Link>
          </div>
        </div>

        {/* Recent Creations Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-chalk">Recent Creations</h2>
            <Link href="/library" className="text-xs text-cobalt hover:underline flex items-center gap-1">
              View All In Library <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <LoadingSpinner size="lg" />
            </div>
          ) : items.length === 0 ? (
            <div className="glass-card flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 py-16 text-center">
              <ImageIcon className="h-10 w-10 text-mist/40 mb-3" />
              <p className="text-sm font-semibold text-chalk">No Generations Yet</p>
              <p className="text-xs text-mist mt-1 max-w-sm">
                Start drawing stills or directing motion clips to populate your creative dashboard.
              </p>
              <div className="mt-6 flex gap-3">
                <Link href="/images">
                  <Button className="btn-press rounded-md bg-cobalt text-xs font-semibold text-chalk">
                    Generate Image
                  </Button>
                </Link>
                <Link href="/video">
                  <Button variant="outline" className="btn-press rounded-md border-white/15 text-xs text-chalk">
                    Generate Video
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {items.map((item) => (
                <div
                  key={item._id}
                  className="group relative overflow-hidden rounded-xl border border-white/10 bg-slateink aspect-video"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.url}
                    alt={item.prompt}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
                    <p className="text-xs text-chalk font-medium line-clamp-2">{item.prompt}</p>
                    <span className="mt-1 font-mono text-[10px] text-saffron uppercase">
                      {item.kind} · {item.ratio}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
