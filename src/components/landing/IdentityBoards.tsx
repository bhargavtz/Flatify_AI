"use client"

import { useRef, type PointerEvent } from "react"
import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion"

interface IdentityBoardsProps {
  compact?: boolean
}

const spring = { stiffness: 120, damping: 18, mass: 0.6 }

export default function IdentityBoards({ compact = false }: IdentityBoardsProps) {
  const reduceMotion = useReducedMotion()
  const wrapRef = useRef<HTMLDivElement>(null)
  const rotateX = useMotionValue(0)
  const rotateY = useMotionValue(0)
  const springX = useSpring(rotateX, spring)
  const springY = useSpring(rotateY, spring)

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (reduceMotion || !wrapRef.current) return
    const rect = wrapRef.current.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width - 0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5
    rotateY.set(px * 16)
    rotateX.set(-py * 12)
  }

  const onLeave = () => {
    rotateX.set(0)
    rotateY.set(0)
  }

  return (
    <div
      ref={wrapRef}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={`relative mx-auto flex max-w-full items-center justify-center overflow-hidden [perspective:1400px] ${
        compact ? "h-[280px] w-full max-w-[380px]" : "h-[320px] w-full max-w-[520px] min-[400px]:h-[380px] sm:h-[460px] md:h-[540px]"
      }`}
      aria-hidden="true"
    >
      <motion.div
        className="relative h-full w-full [transform-style:preserve-3d]"
        style={{
          rotateX: reduceMotion ? 0 : springX,
          rotateY: reduceMotion ? 0 : springY,
        }}
      >
        <article
          className="studio-board absolute left-[6%] top-[8%] h-[64%] w-[48%] bg-saffron text-ink"
          style={{ transform: "translateZ(-72px) rotateY(14deg) rotateX(4deg)" }}
        >
          <CropFrame />
          <div className="flex h-full flex-col justify-between p-4 sm:p-5">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink/60">Still · 16:9</span>
            <StillFrame />
            <span className="font-display text-base font-semibold tracking-tight sm:text-lg">Held light</span>
          </div>
        </article>

        <article
          className="studio-board absolute right-[2%] top-[12%] h-[58%] w-[46%] bg-cobalt text-chalk"
          style={{ transform: "translateZ(-24px) rotateY(-11deg)" }}
        >
          <CropFrame light />
          <div className="flex h-full flex-col justify-between p-4 sm:p-5">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-chalk/70">Clip · 8s</span>
            <FilmStrip />
            <span className="font-display text-base font-semibold tracking-tight sm:text-lg">Slow pan</span>
          </div>
        </article>

        <article
          className="studio-board absolute bottom-[4%] left-[16%] h-[54%] w-[56%] bg-chalk text-ink"
          style={{ transform: "translateZ(56px) rotateY(5deg) rotateX(-3deg)" }}
        >
          <CropFrame />
          <div className="flex h-full flex-col justify-between p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink/50">Cut desk</span>
              <span className="font-mono text-[10px] text-ink/40">Merge</span>
            </div>
            <TimelineMark />
            <span className="font-display text-base font-semibold tracking-tight sm:text-lg">Still into film</span>
          </div>
        </article>
      </motion.div>
    </div>
  )
}

function CropFrame({ light = false }: { light?: boolean }) {
  const c = light ? "bg-chalk/70" : "bg-ink/35"
  return (
    <>
      <span className={`pointer-events-none absolute -left-1 -top-1 h-3 w-px ${c}`} />
      <span className={`pointer-events-none absolute -left-1 -top-1 h-px w-3 ${c}`} />
      <span className={`pointer-events-none absolute -right-1 -top-1 h-3 w-px ${c}`} />
      <span className={`pointer-events-none absolute -right-1 -top-1 h-px w-3 ${c}`} />
      <span className={`pointer-events-none absolute -bottom-1 -left-1 h-3 w-px ${c}`} />
      <span className={`pointer-events-none absolute -bottom-1 -left-1 h-px w-3 ${c}`} />
      <span className={`pointer-events-none absolute -bottom-1 -right-1 h-3 w-px ${c}`} />
      <span className={`pointer-events-none absolute -bottom-1 -right-1 h-px w-3 ${c}`} />
    </>
  )
}

function StillFrame() {
  return (
    <svg viewBox="0 0 160 90" className="mx-auto w-[86%]" fill="none" aria-hidden="true">
      <rect x="4" y="8" width="152" height="74" rx="2" fill="#12151C" />
      <rect x="18" y="28" width="70" height="40" fill="#F3F0EA" />
      <circle cx="118" cy="36" r="16" fill="#FF4D3A" />
    </svg>
  )
}

function FilmStrip() {
  return (
    <svg viewBox="0 0 160 72" className="mx-auto w-[88%]" fill="none" aria-hidden="true">
      <rect x="0" y="8" width="160" height="56" fill="#12151C" />
      <rect x="14" y="18" width="38" height="36" fill="#F3F0EA" />
      <rect x="60" y="18" width="38" height="36" fill="#E8A317" />
      <rect x="106" y="18" width="38" height="36" fill="#F3F0EA" opacity="0.5" />
      {[8, 28, 48, 68, 88, 108, 128, 148].map((x) => (
        <rect key={x} x={x} y="10" width="6" height="6" fill="#2F5BFF" />
      ))}
    </svg>
  )
}

function TimelineMark() {
  return (
    <svg viewBox="0 0 180 48" className="mx-auto w-[90%]" fill="none" aria-hidden="true">
      <rect x="0" y="14" width="52" height="20" fill="#2F5BFF" />
      <rect x="58" y="14" width="72" height="20" fill="#E8A317" />
      <rect x="136" y="14" width="44" height="20" fill="#FF4D3A" />
      <rect x="0" y="40" width="180" height="2" fill="#12151C" opacity="0.25" />
    </svg>
  )
}
