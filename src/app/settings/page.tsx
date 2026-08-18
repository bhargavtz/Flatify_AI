import type { Metadata } from "next"
import SiteShell from "@/components/site/SiteShell"
import SettingsDesk from "@/components/settings/SettingsDesk"

export const metadata: Metadata = {
  title: "Settings — Flatify",
  description: "Public account, plan, generations, spend, and bring-your-own API keys.",
}

export default function SettingsPage() {
  return (
    <SiteShell>
      <SettingsDesk />
    </SiteShell>
  )
}
