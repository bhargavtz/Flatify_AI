"use client"

import { useState } from "react"
import { X, Plus, Globe, Lock, Check } from "lucide-react"
import type { Board } from "@/lib/boards"

export interface BoardModalProps {
  isOpen: boolean
  onClose: () => void
  boards: Board[]
  activeMediaId?: string
  mediaBoardIds?: string[]
  onBoardCreated: (board: Board) => void
  onToggleMediaBoard?: (boardId: string, isAssigned: boolean) => void
}

export default function BoardModal({
  isOpen,
  onClose,
  boards,
  activeMediaId,
  mediaBoardIds = [],
  onBoardCreated,
  onToggleMediaBoard,
}: BoardModalProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [visibility, setVisibility] = useState<"public" | "private">("public")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  if (!isOpen) return null

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setError("Please provide a board title.")
      return
    }

    setBusy(true)
    setError("")
    try {
      const res = await fetch("/api/boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, visibility }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || "Failed to create board.")
        return
      }

      onBoardCreated(json.board)
      setTitle("")
      setDescription("")
      setIsCreating(false)
    } catch {
      setError("Network error creating board.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-ink p-6 text-chalk shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-mist hover:bg-white/10 hover:text-chalk"
        >
          <X className="h-4 w-4" />
        </button>

        <h3 className="text-lg font-bold text-chalk">
          {activeMediaId ? "Save to Board" : "Pinterest Boards"}
        </h3>
        <p className="mt-1 text-xs text-mist">
          {activeMediaId
            ? "Organize this creation into your public or private collections."
            : "Manage your creative boards and collections."}
        </p>

        {/* Existing Boards List */}
        {!isCreating && (
          <div className="mt-5 space-y-2 max-h-60 overflow-y-auto pr-1">
            {boards.length === 0 ? (
              <p className="py-6 text-center text-xs text-mist/60">No boards yet. Create your first board below!</p>
            ) : (
              boards.map((b) => {
                const isAssigned = mediaBoardIds.includes(b._id)
                return (
                  <button
                    key={b._id}
                    type="button"
                    onClick={() => onToggleMediaBoard && onToggleMediaBoard(b._id, isAssigned)}
                    className="flex w-full items-center justify-between rounded-xl border border-white/5 bg-slateink/60 p-3 text-left transition hover:border-cobalt/40 hover:bg-slateink"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cobalt/20 text-cobalt">
                        {b.visibility === "public" ? <Globe className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-chalk">{b.title}</p>
                        <p className="font-mono text-[10px] text-mist uppercase tracking-wider">
                          {b.visibility} · {b.itemCount} items
                        </p>
                      </div>
                    </div>
                    {activeMediaId && (
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-md border ${
                          isAssigned ? "border-cobalt bg-cobalt text-chalk" : "border-white/20 text-transparent"
                        }`}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </div>
                    )}
                  </button>
                )
              })
            )}
          </div>
        )}

        {/* Create Board Form */}
        {isCreating ? (
          <form onSubmit={handleCreate} className="mt-4 space-y-4">
            <div>
              <label className="block font-mono text-xs uppercase text-mist">Board Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Cyberpunk Moodboard"
                className="mt-1 w-full rounded-lg border border-white/15 bg-slateink px-3 py-2 text-sm text-chalk placeholder:text-mist/40 focus:border-cobalt focus:outline-none"
                autoFocus
              />
            </div>

            <div>
              <label className="block font-mono text-xs uppercase text-mist">Description (optional)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief notes about this collection"
                className="mt-1 w-full rounded-lg border border-white/15 bg-slateink px-3 py-2 text-sm text-chalk placeholder:text-mist/40 focus:border-cobalt focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-mono text-xs uppercase text-mist mb-1.5">Visibility</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setVisibility("public")}
                  className={`flex items-center justify-center gap-2 rounded-lg border p-2.5 text-xs font-semibold ${
                    visibility === "public"
                      ? "border-cobalt bg-cobalt/20 text-chalk"
                      : "border-white/10 text-mist hover:text-chalk"
                  }`}
                >
                  <Globe className="h-3.5 w-3.5" />
                  Public (Pinterest)
                </button>
                <button
                  type="button"
                  onClick={() => setVisibility("private")}
                  className={`flex items-center justify-center gap-2 rounded-lg border p-2.5 text-xs font-semibold ${
                    visibility === "private"
                      ? "border-cobalt bg-cobalt/20 text-chalk"
                      : "border-white/10 text-mist hover:text-chalk"
                  }`}
                >
                  <Lock className="h-3.5 w-3.5" />
                  Private (Secret)
                </button>
              </div>
            </div>

            {error && <p className="text-xs text-coral">{error}</p>}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="flex-1 rounded-lg border border-white/10 py-2.5 text-xs font-semibold text-mist hover:text-chalk"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="flex-1 rounded-lg bg-cobalt py-2.5 text-xs font-semibold text-chalk hover:bg-[#4A70FF] disabled:opacity-50"
              >
                {busy ? "Creating…" : "Create Board"}
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-4 border-t border-white/10 pt-4">
            <button
              type="button"
              onClick={() => setIsCreating(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 py-2.5 text-xs font-semibold text-mist hover:border-cobalt hover:text-chalk"
            >
              <Plus className="h-4 w-4" />
              Create New Board
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
