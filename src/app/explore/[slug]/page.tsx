import type { Metadata } from "next"
import { notFound } from "next/navigation"
import SiteShell from "@/components/site/SiteShell"
import WorkDetailView from "@/components/explore/WorkDetailView"
import { getWork, listComments } from "@/lib/social"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const work = await getWork(slug, null)
  if (!work) return { title: "Frame — Flatify" }
  return {
    title: `${work.tagline} — Flatify`,
    description: work.prompt,
  }
}

export default async function ExploreWorkPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const work = await getWork(slug, null)
  if (!work) notFound()
  const comments = await listComments(slug)

  return (
    <SiteShell>
      <WorkDetailView initialWork={work} initialComments={comments} />
    </SiteShell>
  )
}
