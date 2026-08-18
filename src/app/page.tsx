"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ArrowRight, ChevronDown, Image as ImageIcon, Clapperboard, Layers } from "lucide-react"
import Link from "next/link"
import IdentityBoards from "@/components/landing/IdentityBoards"
import SiteHeader from "@/components/site/SiteHeader"
import StudioFooter from "@/components/StudioFooter"
import MobileDock from "@/components/site/MobileDock"

const EASE = [0.23, 1, 0.32, 1] as const

const DESKS = [
  {
    href: "/images",
    icon: ImageIcon,
    kicker: "01",
    title: "Images",
    body: "Stills with held light. Ratio, paper, four takes on the wall.",
  },
  {
    href: "/video",
    icon: Clapperboard,
    kicker: "02",
    title: "Video",
    body: "Clips with a camera. Length, pan, push — then roll.",
  },
  {
    href: "/studio",
    icon: Layers,
    kicker: "03",
    title: "Studio",
    body: "Merge stills and clips on one timeline. Cut. Export.",
  },
]

const FAQ_ITEMS = [
  {
    q: "Is this still a logo tool?",
    a: "No. Flatify is an image and video studio — generate stills, generate clips, then cut them together.",
  },
  {
    q: "Can I merge a photo into a video?",
    a: "Yes. The studio desk is a timeline. Add stills and clips, pick a join (hard cut, dissolve, hold), export one film.",
  },
  {
    q: "Do I need separate tools for image and video?",
    a: "No. Images, Video, and Studio are three desks in one account. Same credits, same library.",
  },
  {
    q: "Can I publish my work for others?",
    a: "Yes. Generate a still or clip, write a tagline, and publish. It lands on Explore with your prompt. Anyone can like, comment, and open your profile.",
  },
  {
    q: "Does it work on a phone?",
    a: "Yes. Phone is a stacked desk with a bottom dock. Desk is a split board. Same work, two ends.",
  },
]

export default function FlatifyLandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  return (
    <div className="relative min-h-dvh min-w-0 overflow-x-hidden bg-ink text-chalk desk-shell">
      <div className="grain" />
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <SiteHeader />

      <main id="main" className="min-w-0">
        <section className="page-max page-pad relative grid min-h-0 items-center gap-8 pb-16 pt-[calc(var(--header-offset)+1.25rem)] md:min-h-[100svh] md:grid-cols-[1.05fr_0.95fr] md:pt-[calc(var(--header-offset)+2rem)]">
          <div className="order-2 min-w-0 md:order-1">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: EASE }}
              className="mb-5 font-mono text-[11px] uppercase tracking-[0.22em] text-saffron sm:mb-6"
            >
              Image · video · cut · explore
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05, ease: EASE }}
              className="font-display text-[clamp(2.4rem,8vw,5.25rem)] font-semibold leading-[0.95] tracking-tight text-chalk text-balance"
            >
              Stills.
              <br />
              Motion. Cut.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.12, ease: EASE }}
              className="mt-5 max-w-md text-base leading-relaxed text-mist text-pretty sm:mt-6 md:text-lg"
            >
              Generate images. Generate video. Merge them on one desk and leave with a film — not a logo.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.18, ease: EASE }}
              className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:items-center"
            >
              <Link
                href="/images"
                className="btn-press inline-flex touch items-center justify-center gap-2 rounded-md bg-cobalt px-6 text-sm font-semibold text-chalk hover:bg-[#4A70FF]"
              >
                Open images
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/explore"
                className="btn-press inline-flex touch items-center justify-center rounded-md border border-chalk/15 px-6 text-sm font-semibold text-chalk hover:border-chalk/40"
              >
                Explore the wall
              </Link>
            </motion.div>
          </div>

          <motion.div
            className="order-1 min-w-0 md:order-2"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1, ease: EASE }}
          >
            <IdentityBoards />
          </motion.div>
        </section>

        <div className="border-y border-chalk/10">
          <dl className="page-max grid grid-cols-2 lg:grid-cols-4">
            {[
              ["Stills", "Image desk"],
              ["Clips", "Video desk"],
              ["Merge", "Cut timeline"],
              ["Out", "4K · 60fps"],
            ].map(([label, value]) => (
              <div key={label} className="border-b border-chalk/10 px-5 py-6 lg:border-b-0 lg:border-r lg:px-8 lg:last:border-r-0">
                <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist">{label}</dt>
                <dd className="mt-2 font-display text-lg font-semibold text-chalk">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <section className="page-max page-pad py-20 md:py-24">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-saffron">Three desks</p>
          <h2 className="mt-4 max-w-lg font-display text-4xl font-semibold tracking-tight text-chalk text-balance md:text-5xl">
            One studio. Three jobs.
          </h2>
          <ul className="mt-12 grid gap-px bg-chalk/10 sm:grid-cols-2 lg:grid-cols-3">
            {DESKS.map((desk) => {
              const Icon = desk.icon
              return (
                <li key={desk.href} className="bg-ink">
                  <Link href={desk.href} className="flex h-full flex-col p-7 transition-colors duration-200 ease-out hover:bg-slateink sm:p-10">
                    <span className="font-mono text-xs text-cobalt">{desk.kicker}</span>
                    <Icon className="mt-6 h-6 w-6 text-saffron" aria-hidden="true" />
                    <h3 className="mt-4 font-display text-2xl font-semibold text-chalk">{desk.title}</h3>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-mist">{desk.body}</p>
                    <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-chalk">
                      Open
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>

        <section className="page-max page-pad py-20 md:py-24">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-saffron">How a film is made</p>
          <h2 className="mt-4 max-w-xl font-display text-4xl font-semibold tracking-tight text-chalk text-balance md:text-5xl">
            Frame. Move. Cut.
          </h2>
          <ol className="mt-12 grid gap-px bg-chalk/10 md:grid-cols-3">
            {[
              { n: "01", title: "Hold a still", body: "Write the image. Pick ratio and paper. Four takes land on the wall." },
              { n: "02", title: "Roll a clip", body: "Same brief, now with length and camera. A take you can play." },
              { n: "03", title: "Join the tape", body: "Drop stills and clips on the timeline. Merge. Export one video." },
            ].map((step) => (
              <li key={step.n} className="bg-ink p-8 md:p-10">
                <span className="font-mono text-xs text-cobalt">{step.n}</span>
                <h3 className="mt-4 font-display text-2xl font-semibold text-chalk">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-mist">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="page-max page-pad mx-auto max-w-3xl py-20 md:py-24">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-saffron">Questions</p>
          <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight text-chalk text-balance">
            Straight answers
          </h2>
          <div className="mt-10 divide-y divide-chalk/10 border-y border-chalk/10">
            {FAQ_ITEMS.map((item, i) => {
              const open = openFaq === i
              return (
                <div key={item.q}>
                  <button
                    type="button"
                    onClick={() => setOpenFaq(open ? null : i)}
                    aria-expanded={open}
                    className="flex min-h-11 w-full items-center justify-between gap-4 py-5 text-left"
                  >
                    <span className="min-w-0 font-display text-lg font-semibold text-chalk text-pretty">{item.q}</span>
                    <ChevronDown
                      className={`h-5 w-5 shrink-0 text-mist transition-transform duration-200 ease-out ${open ? "rotate-180" : ""}`}
                      aria-hidden="true"
                    />
                  </button>
                  <div className={`grid transition-[grid-template-rows] duration-200 ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                    <div className="overflow-hidden">
                      <p className="pb-5 text-sm leading-relaxed text-mist">{item.a}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <section className="bg-cobalt px-[var(--page-pad)] py-16 text-chalk md:py-20">
          <div className="page-max flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
            <h2 className="max-w-xl font-display text-4xl font-semibold tracking-tight text-balance md:text-5xl">
              Put a frame on the table.
            </h2>
            <Link
              href="/signup"
              className="btn-press inline-flex w-full touch items-center justify-center gap-2 rounded-md bg-ink px-6 text-sm font-semibold text-chalk hover:bg-[#1C2230] sm:w-auto"
            >
              Start free
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>

      <StudioFooter />
      <MobileDock />
    </div>
  )
}
