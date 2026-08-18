import type { Metadata } from "next"
import SiteShell from "@/components/site/SiteShell"
import ImageDesk from "@/components/desks/ImageDesk"

export const metadata: Metadata = {
  title: "Images — Flatify",
  description: "Generate stills with held light. Aspect, paper, and a frame you can cut into film.",
}

export default function ImagesPage() {
  return (
    <SiteShell dock>
      <ImageDesk />
    </SiteShell>
  )
}
