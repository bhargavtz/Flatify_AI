"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Clapperboard, Compass, Image as ImageIcon, Layers, Library } from "lucide-react"

const ITEMS = [
  { href: "/images", label: "Images", icon: ImageIcon },
  { href: "/video", label: "Video", icon: Clapperboard },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/studio", label: "Cut", icon: Layers },
  { href: "/settings", label: "You", icon: Library },
]

export default function MobileDock() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Studio"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-chalk/10 bg-ink/95 backdrop-blur-md lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <ul className="grid h-[var(--dock-h)] grid-cols-5">
        {ITEMS.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex h-full min-h-11 flex-col items-center justify-center gap-1 text-[10px] font-semibold uppercase tracking-wider ${
                  active ? "text-chalk" : "text-mist"
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
