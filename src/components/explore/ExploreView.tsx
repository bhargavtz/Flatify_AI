"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Compass } from "lucide-react"
import WorkCard from "@/components/explore/WorkCard"
import WorkBoard from "@/components/explore/WorkBoard"
import type { ExploreSort, PublicWork, WorkKind } from "@/lib/social-types"

type Filter = "all" | WorkKind

export default function ExploreView({ initial }: { initial: PublicWork[] }) {
  const [works, setWorks] = useState(initial)
  const [filter, setFilter] = useState<Filter>("all")
  const [sort, setSort] = useState<ExploreSort>("new")

  useEffect(() => {
    const params = new URLSearchParams()
    if (filter !== "all") params.set("kind", filter)
    params.set("sort", sort)
    fetch(`/api/explore?${params.toString()}`)
      .then((res) => res.json())
      .then((data: { works?: PublicWork[] }) => {
        if (data.works) setWorks(data.works)
      })
      .catch(() => undefined)
  }, [filter, sort])

  const featured = useMemo(() => works.filter((work) => work.featured).slice(0, 3), [works])
  const images = useMemo(() => works.filter((work) => work.kind === "image"), [works])
  const videos = useMemo(() => works.filter((work) => work.kind === "video"), [works])
  const wall = filter === "image" ? images : filter === "video" ? videos : works

  return (
    <div className="page-max page-pad min-w-0 pt-[calc(var(--header-offset)+2rem)] pb-10">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-saffron">Explore</p>
      <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-xl">
          <h1 className="font-display text-4xl font-semibold tracking-tight text-chalk text-balance md:text-5xl">
            The wall.
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-mist">
            Public stills and clips. Prompts, taglines, likes, comments. Generate on a desk, then publish — everyone sees the frame.
          </p>
        </div>
        <Link
          href="/images"
          className="btn-press inline-flex touch items-center justify-center rounded-md bg-cobalt px-5 text-sm font-semibold text-chalk hover:bg-[#4A70FF]"
        >
          Generate & publish
        </Link>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Kind">
          {(["all", "image", "video"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`btn-press touch rounded-md px-4 font-mono text-xs uppercase tracking-wider ${
                filter === key ? "bg-chalk text-ink" : "border border-chalk/15 text-mist hover:text-chalk"
              }`}
            >
              {key === "all" ? "All" : key === "image" ? "Images" : "Video"}
            </button>
          ))}
        </div>
        <div className="flex gap-2" role="group" aria-label="Sort">
          {(["new", "loved"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setSort(key)}
              className={`btn-press min-h-11 rounded-md px-4 font-mono text-xs uppercase tracking-wider ${
                sort === key ? "bg-cobalt text-chalk" : "border border-chalk/15 text-mist hover:text-chalk"
              }`}
            >
              {key === "new" ? "New" : "Loved"}
            </button>
          ))}
        </div>
      </div>

      {filter === "all" && featured.length > 0 ? (
        <section className="mt-12">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-mist">Held on the wall</p>
          <div className="mt-4 grid gap-px bg-chalk/10 md:grid-cols-3">
            {featured.map((work) => (
              <Link key={work.slug} href={`/explore/${work.slug}`} className="bg-ink p-4 hover:bg-slateink">
                <WorkBoard work={work} />
                <p className="mt-4 font-display text-lg font-semibold text-chalk">{work.tagline}</p>
                <p className="mt-1 font-mono text-[11px] text-mist">
                  @{work.author.username} · {work.kind}
                </p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {filter !== "video" ? (
        <section className="mt-14">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-mist">Image section</p>
              <h2 className="mt-2 font-display text-2xl font-semibold text-chalk">Stills</h2>
            </div>
            <p className="font-mono text-[11px] text-mist">{images.length} frames</p>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(filter === "image" ? wall : images).map((work) => (
              <WorkCard key={work.slug} work={work} />
            ))}
          </div>
        </section>
      ) : null}

      {filter !== "image" ? (
        <section className="mt-14">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-mist">Video section</p>
              <h2 className="mt-2 font-display text-2xl font-semibold text-chalk">Clips</h2>
            </div>
            <p className="font-mono text-[11px] text-mist">{videos.length} takes</p>
          </div>
          <div className="mt-6 flex gap-4 overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch] lg:grid lg:grid-cols-3 lg:overflow-visible">
            {(filter === "video" ? wall : videos).map((work) => (
              <div key={work.slug} className="w-[min(18rem,80vw)] shrink-0 lg:w-auto">
                <WorkCard work={work} />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-14">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-mist">Prompts on the table</p>
        <h2 className="mt-2 font-display text-2xl font-semibold text-chalk">What they wrote</h2>
        <ul className="mt-6 divide-y divide-chalk/10 border-y border-chalk/10">
          {wall.slice(0, 10).map((work) => (
            <li key={`prompt-${work.slug}`}>
              <Link href={`/explore/${work.slug}`} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="font-mono text-[11px] text-saffron">
                    @{work.author.username} · {work.kind}
                  </p>
                  <p className="mt-1 text-sm text-chalk text-pretty">{work.prompt}</p>
                  <p className="mt-1 text-sm text-mist">{work.tagline}</p>
                </div>
                <span className="shrink-0 font-mono text-[11px] text-mist">
                  {work.likeCount} likes · {work.commentCount} notes
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-14 border border-chalk/10 bg-slateink p-6 md:p-8">
        <Compass className="h-5 w-5 text-cobalt" aria-hidden="true" />
        <h2 className="mt-4 font-display text-2xl font-semibold text-chalk">How the wall works</h2>
        <ol className="mt-4 grid gap-4 text-sm text-mist md:grid-cols-3">
          <li>
            <span className="font-mono text-[11px] text-cobalt">01</span>
            <p className="mt-1 text-chalk">Generate a still or clip on a desk.</p>
          </li>
          <li>
            <span className="font-mono text-[11px] text-cobalt">02</span>
            <p className="mt-1 text-chalk">Write a tagline. Publish. It lands here with your prompt.</p>
          </li>
          <li>
            <span className="font-mono text-[11px] text-cobalt">03</span>
            <p className="mt-1 text-chalk">Anyone can like, comment, copy the prompt, or open your profile.</p>
          </li>
        </ol>
      </section>
    </div>
  )
}
