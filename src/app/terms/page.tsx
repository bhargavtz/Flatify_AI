import type { Metadata } from "next"
import { LegalDoc } from "@/components/site/LegalDoc"

export const metadata: Metadata = {
  title: "Terms — Flatify",
  description: "Terms for using the Flatify studio.",
}

export default function TermsPage() {
  return (
    <LegalDoc title="Terms" updated="14 August 2026">
      <p>
        By using Flatify you agree to these terms. If you do not agree, do not use the studio.
      </p>
      <h2>The service</h2>
      <p>
        Flatify lets you generate stills and clips, publish to Explore, and optionally use your own model-provider
        keys. Output quality depends on the model. We do not guarantee a specific result.
      </p>
      <h2>Your content</h2>
      <p>
        You keep rights in prompts and files you upload, subject to the provider terms of any model you call. Do not
        submit content you do not have the right to use. Do not publish illegal or abusive material.
      </p>
      <h2>Credits and plans</h2>
      <p>
        Free and paid credit allotments are listed on Pricing. Plan changes go through checkout, not a client-side
        switch. Bring-your-own keys do not spend Flatify credits for those runs.
      </p>
      <h2>Acceptable use</h2>
      <p>
        Do not attempt to access another account, scrape private APIs, or overload the service. We may suspend
        accounts that abuse generation or storage.
      </p>
      <h2>Limitation</h2>
      <p>
        The studio is provided as-is. We are not liable for lost prompts, model downtime, or how you use generated
        media.
      </p>
    </LegalDoc>
  )
}
