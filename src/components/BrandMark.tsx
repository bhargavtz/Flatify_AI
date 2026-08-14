import { cn } from "@/lib/utils"

interface BrandMarkProps {
  className?: string
  size?: number
}

/** Geometric F cut from three planes — the studio mark. */
export function BrandMark({ className, size = 28 }: BrandMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="6" fill="#2F5BFF" />
      <rect x="8" y="7" width="16" height="4" rx="1" fill="#F3F0EA" />
      <rect x="8" y="7" width="4" height="18" rx="1" fill="#F3F0EA" />
      <rect x="8" y="14" width="11" height="4" rx="1" fill="#E8A317" />
    </svg>
  )
}
