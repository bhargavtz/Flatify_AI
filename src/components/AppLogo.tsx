import { BrandMark } from "@/components/BrandMark"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface AppLogoProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

export function AppLogo({ size = "md", className }: AppLogoProps) {
  const textSizeClasses: Record<NonNullable<AppLogoProps["size"]>, string> = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  }
  const markSize = { sm: 24, md: 28, lg: 32 }[size]

  return (
    <Link
      href="/"
      className={cn("flex min-w-0 items-center gap-2 group", className)}
      aria-label="Flatify home"
      translate="no"
    >
      <BrandMark size={markSize} />
      <span
        className={cn(
          "font-display truncate font-semibold tracking-tight text-chalk group-hover:text-white transition-colors duration-200 ease-out",
          textSizeClasses[size]
        )}
      >
        Flatify
      </span>
    </Link>
  )
}
