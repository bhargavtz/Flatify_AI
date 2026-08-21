"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { ArrowLeft, Copy, Heart, MessageSquare } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import WorkBoard from "@/components/explore/WorkBoard"
import type { PublicComment, PublicWork } from "@/lib/social-types"

export default function WorkDetailView({
  initialWork,
  initialComments,
}: {
  initialWork: PublicWork
  initialComments: PublicComment[]
}) {
  const { isSignedIn } = useUser()
  const router = useRouter()
  const [work, setWork] = useState(initialWork)
  const [comments, setComments] = useState(initialComments)
  const [prevSlug, setPrevSlug] = useState(initialWork.slug)
  const [draft, setDraft] = useState("")
  const [copyLabel, setCopyLabel] = useState("Copy prompt")
  const [error, setError] = useState("")

  if (initialWork.slug !== prevSlug) {
    setPrevSlug(initialWork.slug)
    setWork(initialWork)
    setComments(initialComments)
  }

  const like = async () => {
    if (!isSignedIn) {
      router.push("/signup")
      return
    }
    const res = await fetch(`/api/works/${work.slug}/like`, { method: "POST" })
    const data = (await res.json()) as { likeCount?: number; liked?: boolean; error?: string }
    if (!res.ok) {
      setError(data.error ?? "Could not like.")
      return
    }
    setWork((prev) => ({
      ...prev,
      likeCount: data.likeCount ?? prev.likeCount,
      liked: data.liked,
    }))
  }

  const comment = async () => {
    if (!isSignedIn) {
      router.push("/signup")
      return
    }
    setError("")
    const res = await fetch(`/api/works/${work.slug}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: draft }),
    })
    const data = (await res.json()) as { comment?: PublicComment; error?: string }
    if (!res.ok || !data.comment) {
      setError(data.error ?? "Could not comment.")
      return
    }
    setComments((prev) => [...prev, data.comment!])
    setWork((prev) => ({ ...prev, commentCount: prev.commentCount + 1 }))
    setDraft("")
  }

  const copyPrompt = async () => {
    await navigator.clipboard.writeText(work.prompt)
    setCopyLabel("Copied")
    setTimeout(() => setCopyLabel("Copy prompt"), 1400)
  }

  const deskHref = work.kind === "video" ? `/video?prompt=${encodeURIComponent(work.prompt)}` : `/images?prompt=${encodeURIComponent(work.prompt)}`

  return (
    <div className="page-max page-pad min-w-0 pt-[calc(var(--header-offset)+2rem)] pb-12">
      <Link href="/explore" className="inline-flex min-h-11 items-center gap-2 text-sm text-mist hover:text-chalk">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Wall
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <WorkBoard work={work} large />

        <div className="min-w-0">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-saffron">{work.kind}</p>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-chalk text-balance md:text-4xl">
            {work.tagline}
          </h1>
          <Link href={`/u/${work.author.username}`} className="mt-4 block">
            <p className="font-semibold text-chalk">{work.author.displayName}</p>
            <p className="font-mono text-[11px] text-mist">@{work.author.username}</p>
            <p className="mt-1 text-sm text-mist">{work.author.tagline}</p>
          </Link>
          <p className="mt-4 font-mono text-[11px] text-mist">
            {formatDistanceToNow(new Date(work.createdAt), { addSuffix: true })} · {work.ratio}
            {work.paper ? ` · ${work.paper}` : ""}
            {work.length ? ` · ${work.length}` : ""}
            {work.motion ? ` · ${work.motion}` : ""}
          </p>

          <div className="mt-6 border border-chalk/10 bg-slateink p-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-mist">Prompt</p>
            <p className="mt-2 text-sm leading-relaxed text-chalk text-pretty">{work.prompt}</p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={copyPrompt}
                className="btn-press inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-md border border-chalk/15 text-sm font-semibold text-chalk"
              >
                <Copy className="h-4 w-4" aria-hidden="true" />
                {copyLabel}
              </button>
              <Link
                href={deskHref}
                className="btn-press inline-flex min-h-11 flex-1 items-center justify-center rounded-md bg-cobalt text-sm font-semibold text-chalk"
              >
                Use on desk
              </Link>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={like}
              className={`btn-press inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-md border text-sm font-semibold ${
                work.liked ? "border-coral text-coral" : "border-chalk/15 text-chalk"
              }`}
            >
              <Heart className={`h-4 w-4 ${work.liked ? "fill-coral" : ""}`} aria-hidden="true" />
              {work.likeCount} likes
            </button>
            <span className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-md border border-chalk/10 text-sm text-mist">
              <MessageSquare className="h-4 w-4" aria-hidden="true" />
              {work.commentCount} notes
            </span>
          </div>
        </div>
      </div>

      <section className="mt-14 max-w-2xl">
        <h2 className="font-display text-2xl font-semibold text-chalk">Notes</h2>
        <ul className="mt-6 divide-y divide-chalk/10 border-y border-chalk/10">
          {comments.length === 0 ? (
            <li className="py-6 text-sm text-mist">No notes yet. Be the first on the wall.</li>
          ) : (
            comments.map((item) => (
              <li key={item.id} className="py-5">
                <Link href={`/u/${item.author.username}`} className="font-mono text-[11px] text-saffron hover:text-chalk">
                  @{item.author.username}
                </Link>
                <p className="mt-2 text-sm leading-relaxed text-chalk">{item.body}</p>
                <p className="mt-2 font-mono text-[10px] text-mist">
                  {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                </p>
              </li>
            ))
          )}
        </ul>

        <label htmlFor="note" className="mt-6 block font-mono text-[11px] uppercase tracking-[0.16em] text-mist">
          Write a note
        </label>
        <textarea
          id="note"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          maxLength={400}
          placeholder="Say something about the frame, not the fog."
          className="mt-2 w-full resize-none rounded-md border border-chalk/15 bg-slateink p-4 text-sm text-chalk placeholder:text-mist/50"
        />
        <button
          type="button"
          onClick={comment}
          className="btn-press mt-3 inline-flex min-h-11 items-center justify-center rounded-md bg-chalk px-5 text-sm font-semibold text-ink"
        >
          {isSignedIn ? "Post note" : "Sign in to comment"}
        </button>
        {error ? <p className="mt-2 text-xs text-coral">{error}</p> : null}
      </section>
    </div>
  )
}
