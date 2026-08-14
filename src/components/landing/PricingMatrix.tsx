"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Check, Sparkles, Zap, ShieldCheck, Crown } from "lucide-react"
import Link from "next/link"

const PRICING_PLANS = [
  {
    name: "Creator Starter",
    desc: "Perfect for indie creators & hobbyists exploring multi-model AI creation.",
    priceMonthly: "$19",
    priceAnnual: "$15",
    credits: "1,500 Studio Credits/mo",
    features: [
      "Access to Flux.1 & SDXL Turbo",
      "Flatify Vector 3.0 SVG Export",
      "Up to 4K Image Resolution",
      "Standard Generation Queue",
      "Commercial Usage License",
    ],
    popular: false,
    cta: "Start Free Trial",
    gradient: "from-slate-800 to-slate-900",
  },
  {
    name: "Studio Pro Pass",
    desc: "For professional photographers, video directors & brand designers.",
    priceMonthly: "$49",
    priceAnnual: "$39",
    credits: "6,000 Studio Credits/mo",
    features: [
      "ALL Models (Flux.1 Ultra, Midjourney v6.1, Sora Video, Runway Gen-3)",
      "Infinite SVG & 3D Mesh (GLTF/OBJ) Export",
      "8K UHD Master Render Quality",
      "Priority Turbo Processing Queue",
      "Custom Aesthetic Model Fine-Tuning",
      "Team Collaboration & Workspace",
    ],
    popular: true,
    cta: "Claim Studio Pro",
    gradient: "from-indigo-900/80 via-purple-900/50 to-slate-900",
  },
  {
    name: "Enterprise Studio API",
    desc: "High-volume generation infrastructure for enterprise production studios.",
    priceMonthly: "$199",
    priceAnnual: "$159",
    credits: "30,000 Studio Credits/mo",
    features: [
      "Dedicated GPU Infrastructure & API Keys",
      "Custom Model Fine-Tuning & LoRA Weights",
      "Unlimited Concurrent Generations",
      "24/7 Dedicated Studio AI Engineer Support",
      "Custom SLA & IP Indemnification",
    ],
    popular: false,
    cta: "Contact Enterprise Team",
    gradient: "from-slate-800 to-slate-900",
  },
]

export default function PricingMatrix() {
  const [isAnnual, setIsAnnual] = useState(true)

  return (
    <section id="pricing" className="relative py-28 px-4 max-w-7xl mx-auto z-10">
      {/* Header */}
      <div className="text-center mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel border-purple-500/30 text-purple-300 text-xs font-semibold tracking-wider uppercase mb-4"
        >
          <Crown className="w-4 h-4 text-purple-400" />
          Transparent Studio Pass Pricing
        </motion.div>

        <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-6">
          Unleash Unlimited <br />
          <span className="text-gradient">Studio Generation Power</span>
        </h2>

        <p className="text-slate-400 text-lg max-w-xl mx-auto mb-8">
          One pass gives you access to every photography, cinema video, vector, and 3D model engine in the world.
        </p>

        {/* Toggle */}
        <div className="inline-flex items-center gap-3 p-1.5 rounded-full glass-panel border-white/10">
          <button
            onClick={() => setIsAnnual(false)}
            className={`px-5 py-2 rounded-full text-xs font-semibold transition-all ${
              !isAnnual ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            Monthly Billing
          </button>
          <button
            onClick={() => setIsAnnual(true)}
            className={`px-5 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
              isAnnual ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            Annual Billing
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px]">
              Save 20%
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
        {PRICING_PLANS.map((plan, idx) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: idx * 0.15 }}
            className={`relative rounded-3xl p-8 flex flex-col justify-between border transition-all duration-300 ${
              plan.popular
                ? "bg-gradient-to-b from-indigo-950/80 to-slate-950 border-indigo-500/50 shadow-2xl shadow-indigo-500/20 scale-105"
                : "glass-card border-white/10"
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-pink-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg">
                Most Popular Studio Choice
              </div>
            )}

            <div>
              <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
              <p className="text-slate-400 text-xs mb-6 leading-relaxed">{plan.desc}</p>

              {/* Price */}
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-5xl font-black text-white">
                  {isAnnual ? plan.priceAnnual : plan.priceMonthly}
                </span>
                <span className="text-slate-400 text-sm">/ month</span>
              </div>
              <p className="text-indigo-400 text-xs font-semibold mb-8">{plan.credits}</p>

              {/* Feature List */}
              <ul className="space-y-3.5 mb-8">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-3 text-xs text-slate-300">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA */}
            <Link href="/signup">
              <button
                className={`w-full py-4 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                  plan.popular
                    ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-indigo-500/30 hover:brightness-110"
                    : "glass-panel text-white hover:border-indigo-500/50 hover:bg-indigo-600/20"
                }`}
              >
                <Sparkles className="w-4 h-4" />
                {plan.cta}
              </button>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
