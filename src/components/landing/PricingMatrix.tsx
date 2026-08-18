"use client"

import { useState } from "react"
import { Check } from "lucide-react"
import Link from "next/link"

const PRICING_PLANS = [
  {
    name: "Starter",
    desc: "Stills and short clips to learn the desks.",
    priceMonthly: 19,
    priceAnnual: 15,
    credits: "1,500 credits / mo",
    features: [
      "Image desk stills up to 4K",
      "Video clips up to 8s",
      "Cut desk, 3 clips",
      "Commercial license",
    ],
    popular: false,
    cta: "Get Starter",
  },
  {
    name: "Studio",
    desc: "Weekly stills, clips, and merges.",
    priceMonthly: 49,
    priceAnnual: 39,
    credits: "6,000 credits / mo",
    features: [
      "All image & video engines",
      "Clips up to 12s · 60fps",
      "Unlimited timeline clips",
      "Priority queue",
      "Shared library",
    ],
    popular: true,
    cta: "Take studio",
  },
  {
    name: "Enterprise",
    desc: "Volume, keys, and a human on the line.",
    priceMonthly: 199,
    priceAnnual: 159,
    credits: "30,000 credits / mo",
    features: [
      "Dedicated throughput",
      "Fine-tune & LoRA",
      "Concurrent jobs",
      "SLA & IP terms",
    ],
    popular: false,
    cta: "Talk to us",
  },
]

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

export default function PricingMatrix() {
  const [isAnnual, setIsAnnual] = useState(true)

  return (
    <section className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
      <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-saffron">Rate card</p>
          <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight text-chalk text-balance md:text-5xl">
            Pay for the desk, not the fog.
          </h2>
        </div>
        <div className="inline-flex w-full rounded-md border border-chalk/15 p-1 sm:w-auto" role="group" aria-label="Billing period">
          <button
            type="button"
            onClick={() => setIsAnnual(false)}
            className={`btn-press min-h-11 flex-1 rounded px-4 text-sm font-semibold transition-colors duration-200 ease-out sm:flex-none ${
              !isAnnual ? "bg-chalk text-ink" : "text-mist hover:text-chalk"
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setIsAnnual(true)}
            className={`btn-press min-h-11 flex-1 rounded px-4 text-sm font-semibold transition-colors duration-200 ease-out sm:flex-none ${
              isAnnual ? "bg-chalk text-ink" : "text-mist hover:text-chalk"
            }`}
          >
            Annual · save 20%
          </button>
        </div>
      </div>

      <div className="mt-12 grid gap-px bg-chalk/10 lg:grid-cols-3">
        {PRICING_PLANS.map((plan) => (
          <article
            key={plan.name}
            className={`flex flex-col bg-ink p-5 sm:p-8 ${plan.popular ? "ring-2 ring-inset ring-cobalt" : ""}`}
          >
            {plan.popular ? (
              <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-cobalt">Most used</p>
            ) : (
              <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-transparent">·</p>
            )}
            <h3 className="font-display text-2xl font-semibold text-chalk">{plan.name}</h3>
            <p className="mt-2 text-sm text-mist">{plan.desc}</p>
            <p className="mt-6 font-display text-5xl font-semibold tabular-nums text-chalk">
              {money.format(isAnnual ? plan.priceAnnual : plan.priceMonthly)}
              <span className="ml-1 text-base font-medium text-mist">/ mo</span>
            </p>
            <p className="mt-1 font-mono text-xs text-saffron">{plan.credits}</p>
            <ul className="mt-8 flex-1 space-y-3">
              {plan.features.map((feat) => (
                <li key={feat} className="flex items-start gap-2 text-sm text-chalk">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-cobalt" aria-hidden="true" />
                  {feat}
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className={`btn-press mt-8 inline-flex min-h-12 items-center justify-center rounded-md text-sm font-semibold ${
                plan.popular
                  ? "bg-cobalt text-chalk hover:bg-[#4A70FF]"
                  : "border border-chalk/15 text-chalk hover:border-chalk/40"
              }`}
            >
              {plan.cta}
            </Link>
          </article>
        ))}
      </div>
    </section>
  )
}
