"use client"

import Link from "next/link"
import { Heart, MessageSquare } from "lucide-react"
import WorkBoard from "@/components/explore/WorkBoard"
import type { PublicWork } from "@/lib/social-types"

export default function WorkCard({ work }: { work: PublicWork }) {
  return (
    <article className="min-w-0 border border-chalk/10 bg-slateink">
      <Link href={`/explore/${work.slug}`} className="block">
        <WorkBoard work={work} />
      </Link>
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-display text-base font-semibold text-chalk text-pretty">{work.tagline}</p>
            <Link
              href={`/u/${work.author.username}`}
              className="mt-1 block truncate font-mono text-[11px] text-mist hover:text-chalk"
            >
              @{work.author.username}
            </Link>
          </div>
          <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-saffron">
            {work.kind}
          </span>
        </div>
        <p className="line-clamp-2 font-mono text-[11px] leading-relaxed text-mist">{work.prompt}</p>
        <div className="flex items-center gap-4 font-mono text-[11px] text-mist">
          <span className={`inline-flex items-center gap-1 ${work.liked ? "text-coral" : ""}`}>
            <Heart className={`h-3.5 w-3.5 ${work.liked ? "fill-coral" : ""}`} aria-hidden="true" />
            {work.likeCount}
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
            {work.commentCount}
          </span>
        </div>
      </div>
    </article>
  )
}
