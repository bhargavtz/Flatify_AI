import type { Metadata } from "next"
import SoulDesk from "@/components/desks/SoulDesk"

export const metadata: Metadata = {
  title: "Soul Studio — Consistent AI Characters & Avatars | Flatify AI",
  description:
    "Create persistent, photorealistic AI characters, avatars, and digital identities with multi-take consistency.",
}

export default function SoulPage() {
  return <SoulDesk />
}
