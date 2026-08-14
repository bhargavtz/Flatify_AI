import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import SiteShell from "@/components/site/SiteShell"
import WorkCard from "@/components/explore/WorkCard"
import { getProfile, isMyUsername } from "@/lib/social"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>
}): Promise<Metadata> {
  const { username } = await params
  const profile = await getProfile(username, null)
  if (!profile) return { title: "Maker — Flatify" }
  return {
    title: `${profile.displayName} — Flatify`,
    description: profile.bio || profile.tagline,
  }
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const profile = await getProfile(username, null)
  if (!profile) notFound()

  const mine = await isMyUsername(username)
  const images = profile.works.filter((work) => work.kind === "image")
  const videos = profile.works.filter((work) => work.kind === "video")

  return (
    <SiteShell>
      <div className="min-w-0 pt-[var(--header-offset)]">
        <div className="relative h-40 w-full overflow-hidden bg-slateink sm:h-52">
          {profile.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.coverUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-gradient-to-r from-cobalt/50 via-ink to-saffron/25" />
          )}
        </div>

        <div className="page-max page-pad relative pb-12">
          <div className="-mt-10 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-ink bg-slateink">
            {profile.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="font-display text-2xl text-chalk">{profile.displayName.slice(0, 1)}</span>
            )}
          </div>

          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h1 className="font-display text-4xl font-semibold tracking-tight text-chalk">{profile.displayName}</h1>
              <p className="mt-1 font-mono text-sm text-mist">@{profile.username}</p>
              <p className="mt-4 max-w-lg text-lg text-chalk text-pretty">{profile.tagline}</p>
              {profile.bio ? <p className="mt-3 max-w-xl text-sm leading-relaxed text-mist">{profile.bio}</p> : null}
              <p className="mt-4 font-mono text-[11px] text-mist">
                {profile.location ? `${profile.location} · ` : ""}
                {profile.workCount} published · {images.length} stills · {videos.length} clips
              </p>
              {profile.website ? (
                <a
                  href={profile.website}
                  className="mt-2 inline-block text-sm text-cobalt hover:text-chalk"
                  rel="noreferrer"
                  target="_blank"
                >
                  {profile.website.replace(/^https?:\/\//, "")}
                </a>
              ) : null}
            </div>
            {mine ? (
              <Link
                href="/settings?tab=public"
                className="btn-press inline-flex min-h-11 shrink-0 items-center justify-center rounded-md border border-chalk/15 px-5 text-sm font-semibold text-chalk"
              >
                Edit
              </Link>
            ) : null}
          </div>

          {images.length > 0 ? (
            <section className="mt-12">
              <h2 className="font-display text-2xl font-semibold text-chalk">Images</h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {images.map((work) => (
                  <WorkCard key={work.slug} work={work} />
                ))}
              </div>
            </section>
          ) : null}

          {videos.length > 0 ? (
            <section className="mt-12">
              <h2 className="font-display text-2xl font-semibold text-chalk">Video</h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {videos.map((work) => (
                  <WorkCard key={work.slug} work={work} />
                ))}
              </div>
            </section>
          ) : null}

          {profile.works.length === 0 ? (
            <p className="mt-12 text-sm text-mist">Nothing on the wall yet.</p>
          ) : null}
        </div>
      </div>
    </SiteShell>
  )
}
