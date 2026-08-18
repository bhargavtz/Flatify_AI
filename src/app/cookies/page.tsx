import type { Metadata } from "next"
import { LegalDoc } from "@/components/site/LegalDoc"

export const metadata: Metadata = {
  title: "Cookies — Flatify",
  description: "Cookies used by the Flatify studio.",
}

export default function CookiesPage() {
  return (
    <LegalDoc title="Cookies" updated="14 August 2026">
      <p>
        Flatify uses a small set of cookies and similar storage so the studio can sign you in and remember this
        notice.
      </p>
      <h2>Strictly necessary</h2>
      <p>
        Clerk session cookies keep you signed in across pages. Without them, Settings, Dashboard, and generate
        history cannot load as you.
      </p>
      <h2>Preference</h2>
      <p>
        After you tap OK on the cookie notice, we store <code>flatify-cookie-ok</code> in localStorage on this
        browser so we do not show the banner again.
      </p>
      <h2>What we do not set</h2>
      <p>We do not set advertising or cross-site tracking cookies.</p>
      <h2>Control</h2>
      <p>
        You can clear cookies and site data in your browser. That signs you out. See also{" "}
        <a href="/privacy">Privacy</a>.
      </p>
    </LegalDoc>
  )
}
