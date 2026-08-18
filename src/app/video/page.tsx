import type { Metadata } from "next"
import SiteShell from "@/components/site/SiteShell"
import VideoDesk from "@/components/desks/VideoDesk"

export const metadata: Metadata = {
  title: "Video — Flatify",
  description: "Generate clips with a camera. Length, motion, ratio — then the take.",
}

export default function VideoPage() {
  return (
    <SiteShell dock>
      <VideoDesk />
    </SiteShell>
  )
}
