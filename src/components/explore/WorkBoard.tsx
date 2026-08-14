import { Play } from "lucide-react"
import type { PublicWork } from "@/lib/social-types"

function aspectClass(ratio: string): string {
  if (ratio === "1:1") return "aspect-square"
  if (ratio === "9:16") return "aspect-[9/16]"
  if (ratio === "4:3") return "aspect-[4/3]"
  return "aspect-video"
}

export default function WorkBoard({
  work,
  large = false,
}: {
  work: Pick<PublicWork, "kind" | "ratio" | "palette" | "prompt" | "length" | "motion" | "paper">
  large?: boolean
}) {
  const [a, b, c] = work.palette

  return (
    <div
      className={`relative overflow-hidden border border-chalk/10 ${aspectClass(work.ratio)}`}
      style={{ background: b }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${a}cc 0%, ${b} 48%, ${c}55 100%)`,
        }}
      />
      <div className="absolute inset-[12%] border border-chalk/15" />
      <div className="absolute left-[18%] top-0 h-full w-px bg-chalk/10" />
      <div className="absolute inset-x-0 top-[38%] h-px bg-chalk/10" />
      {work.kind === "video" ? (
        <>
          <div className="absolute left-0 top-0 flex h-full w-6 flex-col justify-between py-3 sm:w-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <span key={i} className="mx-auto block h-2 w-3 bg-ink/50 sm:h-2.5 sm:w-4" />
            ))}
          </div>
          <div className="absolute right-0 top-0 flex h-full w-6 flex-col justify-between py-3 sm:w-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <span key={i} className="mx-auto block h-2 w-3 bg-ink/50 sm:h-2.5 sm:w-4" />
            ))}
          </div>
          <span className="absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-chalk text-ink">
            <Play className="h-4 w-4 translate-x-0.5" aria-hidden="true" />
          </span>
          <span className="absolute bottom-3 right-3 font-mono text-[10px] uppercase tracking-wider text-chalk">
            {work.length ?? "8s"} · {work.motion ?? "pan"}
          </span>
        </>
      ) : (
        <span className="absolute bottom-3 left-3 font-mono text-[10px] uppercase tracking-wider text-chalk/80">
          {work.paper ?? "held"} · {work.ratio}
        </span>
      )}
      {large ? (
        <p className="absolute inset-x-8 bottom-10 line-clamp-2 text-center font-display text-sm font-semibold text-chalk/90 sm:text-base">
          {work.prompt}
        </p>
      ) : null}
    </div>
  )
}
