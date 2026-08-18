import type { Metadata } from "next"
import SiteShell from "@/components/site/SiteShell"
import ExploreView from "@/components/explore/ExploreView"
import { listWorks } from "@/lib/social"

export const metadata: Metadata = {
  title: "Explore — Flatify",
  description: "Public stills and clips from the studio. Prompts, taglines, likes, and notes.",
}

export default async function ExplorePage() {
  const works = await listWorks("all", "new", null)
  return (
    <SiteShell>
      <ExploreView initial={works} />
    </SiteShell>
  )
}
