import type { ReactNode } from "react"
import SiteShell from "@/components/site/SiteShell"

export function LegalDoc({
  title,
  updated,
  children,
}: {
  title: string
  updated: string
  children: ReactNode
}) {
  return (
    <SiteShell>
      <article className="page-max page-pad pb-16 pt-[var(--header-offset)]">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-mist">Legal</p>
        <h1 className="mt-2 font-display text-4xl font-semibold text-chalk">{title}</h1>
        <p className="mt-2 text-sm text-mist">Last updated {updated}</p>
        <div className="mt-8 max-w-2xl space-y-6 text-sm leading-relaxed text-mist [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-chalk [&_a]:text-saffron">
          {children}
        </div>
      </article>
    </SiteShell>
  )
}
