"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Lightbulb, Palette, Settings, Users, BookOpen, HelpCircle as PageIcon, Edit3, Cpu, Sparkles, Zap, ShieldCheck } from 'lucide-react';
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HelpPage() {
  return (
    <div className="relative min-h-dvh min-w-0 overflow-x-hidden bg-ink p-4 text-chalk selection:bg-cobalt selection:text-chalk sm:p-8">
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
              Learn how to synthesize prompts, export lossless SVG vector logos, use multi-provider AI model routing, and get the most out of Flatify AI.
            </p>
          </div>

          <Link href="/generate" className="w-full md:w-auto">
            <Button className="btn-press w-full rounded-md bg-cobalt px-6 py-6 text-xs font-semibold text-chalk hover:bg-[#4A70FF] md:w-auto">
              <Zap className="w-4 h-4 mr-2" />
              Launch Studio Generator
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
                <p>Flatify AI Studio is a unified multimodal AI generation platform engineered for high-precision logo design, studio photography, 60FPS video, and 3D rendering.</p>
                <p>Our intelligent routing backend distributes your prompt across top compute clusters (Flux.1 Pro, Midjourney v6.1, Sora Video, and Flatify Vector Pro) to deliver lossless SVG & 8K UHD renders.</p>
              </AccordionContent>
            </AccordionItem>

            {/* Section 2: Small Business Mode */}
            <AccordionItem value="for-novices" className="border-b border-white/10 pb-2">
              <AccordionTrigger className="text-lg md:text-xl font-bold text-white hover:no-underline py-3 hover:text-chalk transition-colors">
                <div className="flex min-w-0 items-center gap-3 text-left">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cobalt/30 bg-cobalt/15">
                    <Users className="w-5 h-5 text-cobalt" />
                  </div>
                  Small Business Guided Workflow (Novice Mode)
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pb-4 pl-0 pt-2 text-sm leading-relaxed text-slate-300 sm:pl-12">
                <p>Designed for founders and business owners who want a clean, professional brand identity in seconds without design experience:</p>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
                  <li><strong className="text-white">Business Name & Slogan:</strong> Enter your brand details.</li>
                  <li><strong className="text-white">Color Preferences:</strong> Pick primary and secondary brand accents.</li>
                  <li><strong className="text-white">Instant Flat Generation:</strong> Click generate to get lossless, minimalist vector-styled logos.</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            {/* Section 3: Pro Studio Mode */}
            <AccordionItem value="for-professionals" className="border-b border-white/10 pb-2">
              <AccordionTrigger className="text-lg md:text-xl font-bold text-white hover:no-underline py-3 hover:text-chalk transition-colors">
                <div className="flex min-w-0 items-center gap-3 text-left">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cobalt/30 bg-cobalt/15">
                    <Palette className="w-5 h-5 text-cobalt" />
                  </div>
                  Pro Studio Mode (Freelance Designers)
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pb-4 pl-0 pt-2 text-sm leading-relaxed text-slate-300 sm:pl-12">
                <p>Pro mode gives graphic designers full control over artistic prompts, aspect ratios, and parameter compiler settings:</p>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
                  <li><strong className="text-white">Detailed Prompting:</strong> Control lighting style, aspect ratios, geometric line weight, and color palettes.</li>
                  <li><strong className="text-white">AI Prompt Refinement:</strong> Auto-compile raw ideas into studio-grade prompts.</li>
                  <li><strong className="text-white">Lossless Code Export:</strong> Export vector SVG paths directly for Figma or Illustrator.</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            {/* Section 4: Image Remix Mode */}
            <AccordionItem value="for-image-editor" className="border-b border-white/10 pb-2">
              <AccordionTrigger className="text-lg md:text-xl font-bold text-white hover:no-underline py-3 hover:text-chalk transition-colors">
                <div className="flex min-w-0 items-center gap-3 text-left">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cobalt/30 bg-cobalt/15">
                    <Edit3 className="w-5 h-5 text-cobalt" />
                  </div>
                  Image Editor (Image Remix Mode)
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pb-4 pl-0 pt-2 text-sm leading-relaxed text-slate-300 sm:pl-12">
                <p>Upload a sketch, moodboard asset, or existing logo to condition new AI generations:</p>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
                  <li><strong className="text-white">Upload Reference Image:</strong> Upload source files up to 4MB.</li>
                  <li><strong className="text-white">Contextual Conditioning:</strong> The AI extracts geometry and color scheme to generate fresh vector concepts.</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            {/* Section 5: Prompting Tips */}
            <AccordionItem value="generation-tips" className="border-b border-white/10 pb-2">
              <AccordionTrigger className="text-lg md:text-xl font-bold text-white hover:no-underline py-3 hover:text-chalk transition-colors">
                <div className="flex min-w-0 items-center gap-3 text-left">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cobalt/30 bg-cobalt/15">
                    <BookOpen className="w-5 h-5 text-cobalt" />
                  </div>
                  Mastering Prompt Synthesis
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pb-4 pl-0 pt-2 text-sm leading-relaxed text-slate-300 sm:pl-12">
                <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
                  <li><strong className="text-white">Use Style Keywords:</strong> Specify keywords like <em>&quot;flat geometric vector&quot;</em>, <em>&quot;duotone color scheme&quot;</em>, <em>&quot;minimalist symbol&quot;</em>.</li>
                  <li><strong className="text-white">Avoid 3D Overload:</strong> Flatify AI excels at clean 2D vector art. Avoid asking for complex drop shadows or heavy 3D textures when aiming for flat logos.</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            {/* Section 6: Technical Details */}
            <AccordionItem value="tech-details" className="border-none">
              <AccordionTrigger className="text-lg md:text-xl font-bold text-white hover:no-underline py-3 hover:text-chalk transition-colors">
                <div className="flex min-w-0 items-center gap-3 text-left">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cobalt/30 bg-cobalt/15">
                    <Cpu className="w-5 h-5 text-cobalt" />
                  </div>
                  Architecture & Compute Infrastructure
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4 pl-0 pt-2 text-sm leading-relaxed text-slate-300 sm:pl-12">
                Flatify AI operates a multi-node routing engine integrated with OpenRouter, Genkit framework, and Google Gemini models. All generation assets are backed by secure MongoDB storage and Clerk user session authorization.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </div>
  );
}
