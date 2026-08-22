"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs"
import { BrandMark } from "@/components/BrandMark"
import { AnimatePresence, motion } from "framer-motion"

const LINKS = [
  { href: "/images", label: "Images" },
  { href: "/video", label: "Cinema" },
  { href: "/soul", label: "Soul ID" },
  { href: "/studio", label: "Studio" },
  { href: "/library", label: "Library" },
  { href: "/explore", label: "Explore" },
  { href: "/pricing", label: "Plans" },
]

export default function SiteHeader() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [prevPathname, setPrevPathname] = useState(pathname)

  if (prevPathname !== pathname) {
    setPrevPathname(pathname)
    setOpen(false)
  }

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 border-b border-chalk/10 bg-ink/80 backdrop-blur-md"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <div className="page-max page-pad flex h-[var(--header-h)] min-w-0 items-center justify-between gap-3">
        <Link href="/" className="flex min-w-0 items-center gap-2" translate="no">
          <BrandMark size={28} />
          <span className="font-display truncate text-base font-semibold tracking-tight text-chalk sm:text-lg">
            Flatify
          </span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary">
          {LINKS.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm transition-colors duration-200 ease-out ${
                  active ? "text-chalk" : "text-mist hover:text-chalk"
                }`}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <SignedIn>
            <Link href="/settings" className="text-sm text-mist transition-colors duration-200 ease-out hover:text-chalk">
              Settings
            </Link>
            <UserButton afterSignOutUrl="/" />
            <Link
              href="/studio"
              className="btn-press inline-flex touch items-center rounded-md bg-cobalt px-4 text-sm font-semibold text-chalk hover:bg-[#4A70FF]"
            >
              Open studio
            </Link>
          </SignedIn>
          <SignedOut>
            <Link href="/login" className="text-sm text-mist transition-colors duration-200 ease-out hover:text-chalk">
              Sign in
            </Link>
            <Link
              href="/signup"
              className="btn-press inline-flex touch items-center rounded-md bg-cobalt px-4 text-sm font-semibold text-chalk hover:bg-[#4A70FF]"
            >
              Start free
            </Link>
          </SignedOut>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="btn-press flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-chalk lg:hidden"
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="max-h-[calc(100dvh-var(--header-offset))] overflow-y-auto border-b border-chalk/10 bg-ink px-[var(--page-pad)] py-5 lg:hidden"
          >
            <nav className="flex flex-col" aria-label="Mobile">
              {LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex min-h-11 items-center text-chalk"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="mt-3 flex flex-col gap-2 border-t border-chalk/10 pt-4">
              <Link href="/settings" className="flex min-h-11 items-center text-sm text-mist">
                Settings
              </Link>
              <Link href="/login" className="flex min-h-11 items-center text-sm text-mist">
                Sign in
              </Link>
              <Link
                href="/signup"
                className="btn-press inline-flex touch items-center justify-center rounded-md bg-cobalt text-sm font-semibold text-chalk"
              >
                Start free
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
