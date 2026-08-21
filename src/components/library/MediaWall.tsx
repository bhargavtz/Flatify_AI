"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Search,
  Sparkles,
  Clapperboard,
  Star,
  FolderPlus,
  Trash2,
  Filter,
  Plus,
  Globe,
  Lock,
  RefreshCw,
} from "lucide-react"
import StorageMeter, { type StorageQuotaData } from "./StorageMeter"
import MediaCard from "./MediaCard"
import BoardModal from "./BoardModal"
import TrashView from "./TrashView"
import type { MediaItem } from "@/lib/user-storage"
import type { Board } from "@/lib/boards"

type FilterTab = "all" | "images" | "videos" | "favorites" | "boards" | "trash"

export default function MediaWall() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<FilterTab>("all")
  const [search, setSearch] = useState("")
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null)

  const [items, setItems] = useState<MediaItem[]>([])
  const [boards, setBoards] = useState<Board[]>([])
  const [quota, setQuota] = useState<StorageQuotaData | null>(null)
  const [loading, setLoading] = useState(true)

  const [isBoardModalOpen, setIsBoardModalOpen] = useState(false)
  const [targetMediaItem, setTargetMediaItem] = useState<MediaItem | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let active = true

    async function fetchData() {
      try {
        const [mediaRes, boardsRes, quotaRes] = await Promise.all([
          fetch("/api/media"),
          fetch("/api/boards"),
          fetch("/api/storage/quota"),
        ])

        const mediaJson = await mediaRes.json()
        const boardsJson = await boardsRes.json()
        const quotaJson = await quotaRes.json()

        if (active) {
          if (mediaJson.ok) setItems(mediaJson.items || [])
          if (boardsJson.ok) setBoards(boardsJson.boards || [])
          if (quotaJson.ok) setQuota(quotaJson.quota)
        }
      } catch {
        /* ignore */
      } finally {
        if (active) setLoading(false)
      }
    }

    fetchData()
    return () => {
      active = false
    }
  }, [refreshKey])

  const handleToggleFavorite = async (id: string, isFav: boolean) => {
    setItems((prev) =>
      prev.map((item) => (item._id === id ? { ...item, isFavorite: !isFav } : item))
    )
    await fetch("/api/media", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mediaId: id, isFavorite: !isFav }),
    })
  }

  const handleToggleVisibility = async (id: string, currentVis: "public" | "private") => {
    const nextVis = currentVis === "public" ? "private" : "public"
    setItems((prev) =>
      prev.map((item) => (item._id === id ? { ...item, visibility: nextVis } : item))
    )
    await fetch("/api/media", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mediaId: id, visibility: nextVis }),
    })
  }

  const handleDelete = async (id: string) => {
    setItems((prev) => prev.filter((item) => item._id !== id))
    await fetch(`/api/media?mediaId=${id}`, { method: "DELETE" })
    // Refresh quota to update trash count
    const qRes = await fetch("/api/storage/quota")
    const qJson = await qRes.json()
    if (qJson.ok) setQuota(qJson.quota)
  }

  const handleOpenBoardModal = (item: MediaItem) => {
    setTargetMediaItem(item)
    setIsBoardModalOpen(true)
  }

  const handleToggleMediaBoard = async (boardId: string, isAssigned: boolean) => {
    if (!targetMediaItem) return
    const action = isAssigned ? "removeMedia" : "addMedia"
    const nextBoardIds = isAssigned
      ? targetMediaItem.boardIds.filter((id) => id !== boardId)
      : [...targetMediaItem.boardIds, boardId]

    setTargetMediaItem({ ...targetMediaItem, boardIds: nextBoardIds })
    setItems((prev) =>
      prev.map((i) => (i._id === targetMediaItem._id ? { ...i, boardIds: nextBoardIds } : i))
    )

    await fetch("/api/boards", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        boardId,
        action,
        mediaId: targetMediaItem._id,
      }),
    })

    // Refresh boards for live item count
    const bRes = await fetch("/api/boards")
    const bJson = await bRes.json()
    if (bJson.ok) setBoards(bJson.boards || [])
  }

  // Filter items
  const filteredItems = items.filter((item) => {
    if (selectedBoardId && !item.boardIds.includes(selectedBoardId)) return false
    if (activeTab === "images" && item.kind !== "image") return false
    if (activeTab === "videos" && item.kind !== "video") return false
    if (activeTab === "favorites" && !item.isFavorite) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      return item.prompt.toLowerCase().includes(q) || item.tagline?.toLowerCase().includes(q)
    }
    return true
  })

  return (
    <div className="page-max page-pad space-y-8 pt-[calc(var(--header-offset)+2rem)] pb-24">
      {/* Top Header & Storage Quota */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 rounded-md border border-cobalt/30 bg-cobalt/15 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-saffron">
            <Sparkles className="w-3.5 h-3.5 text-cobalt" />
            Studio Storage & Pinterest Boards
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">
            My Creative Library
          </h1>
          <p className="text-sm text-mist max-w-lg">
            Manage your AI image & video assets, organize into public or secret Pinterest boards, and monitor your 500 MB cloud quota.
          </p>
        </div>

        <div className="w-full lg:max-w-xs">
          <StorageMeter quota={quota} />
        </div>
      </div>

      {/* Navigation Toolbar */}
      <div className="flex flex-col gap-4 border-y border-white/10 py-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-2 sm:pb-0 font-mono text-xs">
          {[
            { id: "all", label: "All Items", icon: Filter },
            { id: "images", label: "Images", icon: Sparkles },
            { id: "videos", label: "Videos", icon: Clapperboard },
            { id: "favorites", label: "Starred", icon: Star },
            { id: "boards", label: "Boards", icon: FolderPlus },
            { id: "trash", label: `Trash (${quota?.trashCount || 0})`, icon: Trash2 },
          ].map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id as FilterTab)
                  setSelectedBoardId(null)
                }}
                className={`btn-press flex items-center gap-1.5 rounded-lg px-3 py-2 whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-cobalt text-chalk font-semibold shadow"
                    : "text-mist hover:text-chalk hover:bg-white/5"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Search Bar & Board Action */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-mist" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search prompts..."
              className="w-full rounded-lg border border-white/10 bg-slateink pl-9 pr-3 py-1.5 text-xs text-chalk placeholder:text-mist/40 focus:border-cobalt focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setTargetMediaItem(null)
              setIsBoardModalOpen(true)
            }}
            className="btn-press flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-chalk hover:border-cobalt hover:bg-cobalt/20 shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            New Board
          </button>
        </div>
      </div>

      {/* Board Selector Pills (When in All/Images/Videos mode and boards exist) */}
      {boards.length > 0 && activeTab !== "trash" && activeTab !== "boards" && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <span className="font-mono text-[11px] uppercase tracking-wider text-mist shrink-0 mr-1">
            Filter Board:
          </span>
          <button
            type="button"
            onClick={() => setSelectedBoardId(null)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              selectedBoardId === null
                ? "bg-chalk text-ink font-semibold"
                : "border border-white/10 text-mist hover:text-chalk"
            }`}
          >
            All Boards
          </button>
          {boards.map((b) => (
            <button
              key={b._id}
              type="button"
              onClick={() => setSelectedBoardId(b._id === selectedBoardId ? null : b._id)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition ${
                selectedBoardId === b._id
                  ? "bg-cobalt text-chalk font-semibold shadow"
                  : "border border-white/10 text-mist hover:text-chalk"
              }`}
            >
              {b.visibility === "public" ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
              {b.title} ({b.itemCount})
            </button>
          ))}
        </div>
      )}

      {/* View Switcher */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <RefreshCw className="h-8 w-8 animate-spin text-cobalt" />
        </div>
      ) : activeTab === "trash" ? (
        <TrashView onRestored={() => setRefreshKey((k) => k + 1)} />
      ) : activeTab === "boards" ? (
        /* Boards Overview View */
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {boards.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 py-16 text-center">
              <FolderPlus className="h-10 w-10 text-mist/40 mb-3" />
              <p className="text-sm font-semibold text-chalk">No Boards Created</p>
              <p className="text-xs text-mist mt-1">Create your first public or secret board to curate collections.</p>
              <button
                type="button"
                onClick={() => {
                  setTargetMediaItem(null)
                  setIsBoardModalOpen(true)
                }}
                className="btn-press mt-4 flex items-center gap-1.5 rounded-lg bg-cobalt px-4 py-2 text-xs font-semibold text-chalk"
              >
                <Plus className="h-4 w-4" /> Create Board
              </button>
            </div>
          ) : (
            boards.map((b) => (
              <div
                key={b._id}
                onClick={() => {
                  setSelectedBoardId(b._id)
                  setActiveTab("all")
                }}
                className="group cursor-pointer rounded-2xl border border-white/10 bg-slateink p-5 transition hover:border-cobalt/50 hover:shadow-2xl"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cobalt/20 text-cobalt">
                    {b.visibility === "public" ? <Globe className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                  </div>
                  <span className="font-mono text-xs text-saffron">{b.itemCount} items</span>
                </div>

                <h3 className="mt-4 text-base font-bold text-chalk group-hover:text-cobalt transition-colors">
                  {b.title}
                </h3>
                {b.description && <p className="mt-1 text-xs text-mist line-clamp-2">{b.description}</p>}

                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-[11px] font-mono text-mist">
                  <span className="capitalize">{b.visibility} Board</span>
                  <span>{new Date(b.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 py-24 text-center">
          <Sparkles className="h-10 w-10 text-mist/40 mb-3" />
          <p className="text-sm font-semibold text-chalk">No creations found</p>
          <p className="text-xs text-mist mt-1 max-w-sm">
            {search ? `No items match "${search}".` : "Generate new stills in Images or clips in Video Desk to populate your studio library."}
          </p>
        </div>
      ) : (
        /* Pinterest Multi-Column Masonry Grid */
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4">
          {filteredItems.map((item) => (
            <MediaCard
              key={item._id}
              item={item}
              onToggleFavorite={handleToggleFavorite}
              onToggleVisibility={handleToggleVisibility}
              onOpenBoardModal={handleOpenBoardModal}
              onDelete={handleDelete}
              onMakeVideo={(p, r) => router.push(`/video?prompt=${encodeURIComponent(p)}&ratio=${r}`)}
            />
          ))}
        </div>
      )}

      {/* Board Selector Modal */}
      <BoardModal
        isOpen={isBoardModalOpen}
        onClose={() => setIsBoardModalOpen(false)}
        boards={boards}
        activeMediaId={targetMediaItem?._id}
        mediaBoardIds={targetMediaItem?.boardIds || []}
        onBoardCreated={(newBoard) => setBoards((prev) => [newBoard, ...prev])}
        onToggleMediaBoard={handleToggleMediaBoard}
      />
    </div>
  )
}
