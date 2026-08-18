import type { Metadata } from "next"
import { LegalDoc } from "@/components/site/LegalDoc"

export const metadata: Metadata = {
  title: "Privacy — Flatify",
  description: "How Flatify stores account, generation, and key data.",
}

export default function PrivacyPage() {
  return (
    <LegalDoc title="Privacy" updated="14 August 2026">
      <p>
        Flatify is an image and video studio. This page describes what we store and why. It is not legal advice.
      </p>
      <h2>Account</h2>
      <p>
        Sign-in is handled by Clerk. We receive your Clerk user id, name, email, and avatar URL so we can open your
        studio session and public profile.
      </p>
      <h2>Studio data</h2>
      <p>
        Prompts, published works, likes, comments, settings, and generation history are stored in our database keyed
        to your Clerk id. Public works on Explore and <code>/u/…</code> are visible to anyone.
      </p>
      <h2>API keys you bring</h2>
      <p>
        Optional provider keys are encrypted at rest and used only to call the provider you selected. We show the last
        four characters so you can recognise a saved key. Remove a key from Settings at any time.
      </p>
      <h2>Cookies</h2>
      <p>
        Session cookies keep you signed in. Details are on the{" "}
        <a href="/cookies">Cookies</a> page.
      </p>
      <h2>What we do not do</h2>
      <p>We do not sell your account data. We do not use advertising cookies.</p>
      <h2>Contact</h2>
      <p>
        Questions: use the in-app help desk or the email on your Clerk account recovery flow.
      </p>
    </LegalDoc>
  )
}
