"use client"

import { BrandMark } from "@/components/BrandMark"
import Link from "next/link"

export default function StudioFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-chalk/10 bg-ink text-mist">
      <div className="page-max page-pad py-8 md:py-16">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="inline-flex min-w-0 items-center gap-2 text-chalk" translate="no">
            <BrandMark size={24} />
            <span className="font-display text-base font-semibold tracking-tight md:text-lg">Flatify</span>
          </Link>
          <p className="hidden max-w-sm text-right text-xs leading-snug sm:block md:text-sm">
            Image generation, video generation, and a cut desk to merge them.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-4 md:mt-10 md:grid-cols-3 md:gap-12">
          <div>
            <h4 className="font-mono text-[10px] uppercase tracking-[0.18em] text-chalk">Desks</h4>
            <ul className="mt-2 space-y-1.5 text-sm md:mt-4 md:space-y-2">
              <li><Link href="/explore" className="hover:text-chalk">Explore</Link></li>
              <li><Link href="/images" className="hover:text-chalk">Images</Link></li>
              <li><Link href="/video" className="hover:text-chalk">Video</Link></li>
              <li><Link href="/studio" className="hover:text-chalk">Studio</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-mono text-[10px] uppercase tracking-[0.18em] text-chalk">Studio</h4>
            <ul className="mt-2 space-y-1.5 text-sm md:mt-4 md:space-y-2">
              <li><Link href="/settings" className="hover:text-chalk">Settings</Link></li>
              <li><Link href="/pricing" className="hover:text-chalk">Plans</Link></li>
              <li><Link href="/signup" className="hover:text-chalk">Start free</Link></li>
              <li><Link href="/login" className="hover:text-chalk">Sign in</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-mono text-[10px] uppercase tracking-[0.18em] text-chalk">Legal</h4>
            <ul className="mt-2 space-y-1.5 text-sm md:mt-4 md:space-y-2">
              <li><Link href="/privacy" className="hover:text-chalk">Privacy</Link></li>
              <li><Link href="/terms" className="hover:text-chalk">Terms</Link></li>
              <li><Link href="/cookies" className="hover:text-chalk">Cookies</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-6 flex flex-row items-center justify-between gap-3 border-t border-chalk/10 pt-4 font-mono text-[11px] md:mt-14 md:pt-6">
          <p>© {year} Flatify</p>
          <p className="text-saffron">Frame ready</p>
        </div>
      </div>
    </footer>
  )
}
