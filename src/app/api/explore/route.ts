import { NextResponse } from "next/server"
import { listWorks, viewerId } from "@/lib/social"
import type { ExploreSort, WorkKind } from "@/lib/social-types"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const kindParam = searchParams.get("kind")
  const sortParam = searchParams.get("sort")
  const kind: WorkKind | "all" =
    kindParam === "image" || kindParam === "video" ? kindParam : "all"
  const sort: ExploreSort = sortParam === "loved" ? "loved" : "new"
  const clerkId = await viewerId()
  const works = await listWorks(kind, sort, clerkId)
  return NextResponse.json({ works })
}
