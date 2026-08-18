import type { Metadata } from "next"
import SiteShell from "@/components/site/SiteShell"
import PricingMatrix from "@/components/landing/PricingMatrix"

export const metadata: Metadata = {
  title: "Plans — Flatify",
  description: "Credits for stills, clips, and the cut desk. Monthly or annual.",
}

export default function PricingPage() {
  return (
    <SiteShell>
      <div className="pt-[var(--header-offset)]">
        <PricingMatrix />
      </div>
    </SiteShell>
  )
}
