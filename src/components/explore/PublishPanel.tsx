"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import type { WorkKind } from "@/lib/social-types"

export default function PublishPanel({
  kind,
  prompt,
  ratio,
  paper,
  motion,
  length,
}: {
  kind: WorkKind
  prompt: string
  ratio: string
  paper?: string
  motion?: string
  length?: string
}) {
  const { isSignedIn } = useUser()
  const router = useRouter()
  const [tagline, setTagline] = useState("")
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle")
  const [message, setMessage] = useState("")

  const publish = async () => {
    if (!isSignedIn) {
      router.push("/signup")
      return
    }
    setStatus("saving")
    setMessage("")
    try {
      const res = await fetch("/api/works", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, prompt, tagline, ratio, paper, motion, length }),
      })
      const data = (await res.json()) as { work?: { slug: string }; error?: string }
      if (!res.ok || !data.work) {
        setStatus("error")
        setMessage(data.error ?? "Could not publish.")
        return
      }
      setStatus("done")
      setMessage("On the wall.")
      router.push(`/explore/${data.work.slug}`)
    } catch {
      setStatus("error")
      setMessage("Network error.")
    }
  }

  return (
    <div className="mt-6 border border-chalk/10 bg-slateink p-4">
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-saffron">Publish</p>
      <p className="mt-2 text-sm text-mist">
        Put this {kind} on Explore with your name, prompt, and a tagline. Anyone can like and comment.
      </p>
      <label htmlFor={`${kind}-tagline`} className="mt-4 block font-mono text-[11px] uppercase tracking-[0.16em] text-mist">
        Tagline
      </label>
      <input
        id={`${kind}-tagline`}
        value={tagline}
        onChange={(e) => setTagline(e.target.value)}
        maxLength={140}
        placeholder="One line the wall can hold."
        className="mt-2 w-full rounded-md border border-chalk/15 bg-ink px-3 py-3 text-sm text-chalk placeholder:text-mist/50"
      />
      <button
        type="button"
        onClick={publish}
        disabled={status === "saving"}
        className="btn-press mt-4 flex w-full touch items-center justify-center rounded-md border border-chalk/15 text-sm font-semibold text-chalk hover:border-chalk/40 disabled:opacity-70"
      >
        {status === "saving" ? "Publishing…" : isSignedIn ? "Publish to Explore" : "Sign in to publish"}
      </button>
      {message ? (
        <p className={`mt-2 text-xs ${status === "error" ? "text-coral" : "text-saffron"}`}>{message}</p>
      ) : null}
    </div>
  )
}
