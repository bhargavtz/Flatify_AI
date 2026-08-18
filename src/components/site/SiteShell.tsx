import type { ReactNode } from "react"
import SiteHeader from "@/components/site/SiteHeader"
import StudioFooter from "@/components/StudioFooter"
import MobileDock from "@/components/site/MobileDock"

export default function SiteShell({
  children,
  dock = true,
}: {
  children: ReactNode
  dock?: boolean
}) {
  return (
    <div className={`relative min-h-dvh min-w-0 overflow-x-hidden bg-ink text-chalk ${dock ? "desk-shell" : ""}`}>
      <div className="grain" />
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <SiteHeader />
      <main id="main" className="min-w-0">
        {children}
      </main>
      <StudioFooter />
      {dock ? <MobileDock /> : null}
    </div>
  )
}
