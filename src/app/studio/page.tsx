import type { Metadata } from "next"
import SiteShell from "@/components/site/SiteShell"
import CutDesk from "@/components/desks/CutDesk"

export const metadata: Metadata = {
  title: "Studio — Flatify",
  description: "Merge stills and clips on one timeline. Hard cut, dissolve, export a video.",
}

export default function StudioPage() {
  return (
    <SiteShell dock>
      <CutDesk />
    </SiteShell>
  )
}
