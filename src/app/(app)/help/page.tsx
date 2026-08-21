"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Lightbulb, Clapperboard, Sparkles, Image as ImageIcon, HardDrive, ShieldCheck } from 'lucide-react';
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HelpPage() {
  return (
    <div className="relative min-h-dvh min-w-0 overflow-x-hidden bg-ink p-4 text-chalk selection:bg-cobalt selection:text-chalk sm:p-8 pt-[calc(var(--header-offset)+1.5rem)]">
      <div className="grain" />

      <div className="max-w-5xl mx-auto space-y-10 relative z-10">
        {/* Header Title Section */}
        <div className="glass-card flex flex-col items-start justify-between gap-6 rounded-3xl border border-white/10 p-6 md:flex-row md:items-center md:p-10">
          <div className="min-w-0 space-y-2">
            <div className="inline-flex items-center gap-2 rounded-md border border-cobalt/30 bg-cobalt/15 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-saffron">
              <Sparkles className="w-3.5 h-3.5 text-cobalt" />
              Flatify AI Documentation & Help
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
              Studio Knowledge Base
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
              Learn how to prompt AI stills, direct cinematic camera motion, manage Pinterest boards, and utilize your 500 MB cloud storage quota.
            </p>
          </div>

          <Link href="/images" className="w-full md:w-auto">
            <Button className="btn-press w-full rounded-md bg-cobalt px-6 py-6 text-xs font-semibold text-chalk hover:bg-[#4A70FF] md:w-auto">
              <ImageIcon className="w-4 h-4 mr-2" />
              Launch Image Studio
            </Button>
          </Link>
        </div>

        {/* Accordion FAQ & Help Sections */}
        <div className="glass-card p-6 md:p-8 rounded-3xl border border-white/10">
          <Accordion type="single" collapsible className="w-full space-y-4" defaultValue="what-is">
            {/* Section 1: What is Flatify AI? */}
            <AccordionItem value="what-is" className="border-b border-white/10 pb-2">
              <AccordionTrigger className="text-lg md:text-xl font-bold text-white hover:no-underline py-3 hover:text-chalk transition-colors">
                <div className="flex min-w-0 items-center gap-3 text-left">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cobalt/30 bg-cobalt/15">
                    <Lightbulb className="w-5 h-5 text-cobalt" />
                  </div>
                  What is Flatify AI Studio?
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-2 pb-4 pl-0 pt-2 text-sm leading-relaxed text-slate-300 sm:pl-12">
                <p>Flatify AI Studio is a unified multimodal AI generation platform engineered for high-precision image generation, cinematic 4K video clips, motion direction, and creative library management.</p>
                <p>All creations are automatically organized into your 500 MB personal storage workspace with full prompt history and Pinterest-style board curation.</p>
              </AccordionContent>
            </AccordionItem>

            {/* Section 2: Image Studio */}
            <AccordionItem value="image-studio" className="border-b border-white/10 pb-2">
              <AccordionTrigger className="text-lg md:text-xl font-bold text-white hover:no-underline py-3 hover:text-chalk transition-colors">
                <div className="flex min-w-0 items-center gap-3 text-left">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cobalt/30 bg-cobalt/15">
                    <ImageIcon className="w-5 h-5 text-cobalt" />
                  </div>
                  AI Image Studio (4 Simultaneous Takes)
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pb-4 pl-0 pt-2 text-sm leading-relaxed text-slate-300 sm:pl-12">
                <p>Enter any text prompt and generate 4 distinct creative takes simultaneously:</p>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
                  <li><strong className="text-white">Master Shot:</strong> Atmospheric wide-angle master composition.</li>
                  <li><strong className="text-white">Cinematic Tone:</strong> 35mm film photography with golden hour lighting.</li>
                  <li><strong className="text-white">Studio Contrast:</strong> Commercial high-contrast design.</li>
                  <li><strong className="text-white">Editorial Minimal:</strong> Modern minimalist aesthetic layout.</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            {/* Section 3: Video Studio */}
            <AccordionItem value="video-studio" className="border-b border-white/10 pb-2">
              <AccordionTrigger className="text-lg md:text-xl font-bold text-white hover:no-underline py-3 hover:text-chalk transition-colors">
                <div className="flex min-w-0 items-center gap-3 text-left">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cobalt/30 bg-cobalt/15">
                    <Clapperboard className="w-5 h-5 text-cobalt" />
                  </div>
                  AI Video & Motion Studio
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pb-4 pl-0 pt-2 text-sm leading-relaxed text-slate-300 sm:pl-12">
                <p>Direct camera movements and motion pacing with the motion compiler:</p>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
                  <li><strong className="text-white">Camera Movements:</strong> Slow Pan, Push In, Orbit 360, Crane Up, and Whip Pan.</li>
                  <li><strong className="text-white">Motion Timeline:</strong> Scrub, loop, and preview animated motion frames.</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            {/* Section 4: 500 MB Storage & Trash */}
            <AccordionItem value="storage" className="border-b border-white/10 pb-2">
              <AccordionTrigger className="text-lg md:text-xl font-bold text-white hover:no-underline py-3 hover:text-chalk transition-colors">
                <div className="flex min-w-0 items-center gap-3 text-left">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cobalt/30 bg-cobalt/15">
                    <HardDrive className="w-5 h-5 text-cobalt" />
                  </div>
                  500 MB User Storage & 30-Day Backup Guarantee
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pb-4 pl-0 pt-2 text-sm leading-relaxed text-slate-300 sm:pl-12">
                <p>Every creator account is allocated 500 MB of cloud storage with zero egress fees:</p>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
                  <li><strong className="text-white">Real-Time Meter:</strong> Live tracking of your MB usage and item counts.</li>
                  <li><strong className="text-white">30-Day Trash:</strong> Deleted items are safely preserved for 30 days before permanent deletion.</li>
                  <li><strong className="text-white">1-Click Restore:</strong> Instantly recover items back to your library.</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            {/* Section 5: Security & Keys */}
            <AccordionItem value="security" className="border-none">
              <AccordionTrigger className="text-lg md:text-xl font-bold text-white hover:no-underline py-3 hover:text-chalk transition-colors">
                <div className="flex min-w-0 items-center gap-3 text-left">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cobalt/30 bg-cobalt/15">
                    <ShieldCheck className="w-5 h-5 text-cobalt" />
                  </div>
                  BYOK & Security
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4 pl-0 pt-2 text-sm leading-relaxed text-slate-300 sm:pl-12">
                Flatify AI encrypts all user-supplied API keys (OpenAI, OpenRouter, Google AI) at rest using AES-256-GCM. Free neural synthesis is always available out of the box without requiring external keys.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </div>
  );
}
