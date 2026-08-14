"use client"

import { Sparkles, ArrowRight, Github, Twitter, MessageSquare, Mail, Shield, Zap, Globe, Heart } from "lucide-react"
import Link from "next/link"

export default function StudioFooter() {
  return (
    <footer className="relative bg-[#030407] text-slate-300 border-t border-white/10 overflow-hidden z-10 pt-20 pb-10">
      {/* Subtle Background Glows */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-gradient-to-t from-violet-600/10 via-cyan-500/5 to-transparent blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Top Newsletter / Call To Action Banner */}
        <div className="glass-card rounded-3xl p-8 md:p-12 mb-16 border border-violet-500/30 flex flex-col lg:flex-row items-center justify-between gap-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="space-y-2 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 text-violet-300 text-xs font-semibold uppercase tracking-wider border border-violet-500/20 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              Join 120,000+ AI Creators
            </div>
            <h3 className="text-2xl md:text-4xl font-extrabold text-white">
              Ready to build with Flatify AI?
            </h3>
            <p className="text-slate-400 text-sm max-w-lg">
              Unlock every image, video, vector, and 3D AI model in one unified studio. No credit card required to start.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            <Link href="/signup" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xl shadow-violet-600/25 hover:brightness-110 active:scale-95 transition-all">
                <span>Start Free Trial</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </div>

        {/* Main Footer Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 pb-16 border-b border-white/10">
          {/* Col 1: Brand Info */}
          <div className="col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 p-0.5 shadow-lg shadow-violet-600/20">
                <div className="w-full h-full bg-[#07090F] rounded-[10px] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-violet-400" />
                </div>
              </div>
              <span className="text-xl font-black text-white tracking-tight">
                FLATIFY AI <span className="text-xs font-mono text-violet-400 uppercase">Studio</span>
              </span>
            </Link>

            <p className="text-xs text-slate-400 max-w-sm leading-relaxed font-light">
              The world-class multimodal AI generation platform. Synthesizing photography, 60FPS video, lossless SVG vector logos, and 3D assets in seconds.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <a href="#" className="w-9 h-9 rounded-xl glass-panel flex items-center justify-center text-slate-400 hover:text-white hover:border-violet-500/50 transition-all">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-xl glass-panel flex items-center justify-center text-slate-400 hover:text-white hover:border-violet-500/50 transition-all">
                <MessageSquare className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-xl glass-panel flex items-center justify-center text-slate-400 hover:text-white hover:border-violet-500/50 transition-all">
                <Github className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Col 2: Product */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Product</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#studio-models" className="hover:text-violet-400 transition-colors">Flux.1 Pro Ultra</a></li>
              <li><a href="#studio-models" className="hover:text-violet-400 transition-colors">Midjourney v6.1</a></li>
              <li><a href="#studio-models" className="hover:text-violet-400 transition-colors">Sora Video Gen-2</a></li>
              <li><a href="#studio-models" className="hover:text-violet-400 transition-colors">Runway Gen-3 Alpha</a></li>
              <li><a href="#studio-models" className="hover:text-violet-400 transition-colors">Flatify Vector Pro</a></li>
            </ul>
          </div>

          {/* Col 3: Resources */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Resources</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#interactive-playground" className="hover:text-violet-400 transition-colors">Interactive Sandbox</a></li>
              <li><a href="#how-it-works" className="hover:text-violet-400 transition-colors">Prompt Architecture</a></li>
              <li><a href="#faq" className="hover:text-violet-400 transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-violet-400 transition-colors">OpenRouter Status</a></li>
              <li><a href="#" className="hover:text-violet-400 transition-colors">API Pricing Calculator</a></li>
            </ul>
          </div>

          {/* Col 4: Company */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Company</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#" className="hover:text-violet-400 transition-colors">About Flatify AI</a></li>
              <li><a href="#" className="hover:text-violet-400 transition-colors">Careers & Research</a></li>
              <li><a href="#" className="hover:text-violet-400 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-violet-400 transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-violet-400 transition-colors">Security & Trust</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>© {new Date().getFullYear()} Flatify AI Studio Inc.</span>
            <span>•</span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              All AI Provider Nodes Operational
            </span>
          </div>

          <div className="flex items-center gap-1">
            <span>Crafted with</span>
            <Heart className="w-3.5 h-3.5 text-pink-500 fill-pink-500" />
            <span>for Studio Creators worldwide</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
