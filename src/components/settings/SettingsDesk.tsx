"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { formatDistanceToNow } from "date-fns"
import { Camera, ExternalLink, KeyRound, List, Sparkles, UserRound } from "lucide-react"
import { KEY_PROVIDERS, STUDIO_PLANS, type SettingsBundle } from "@/lib/settings-shared"
import type { KeyProvider } from "@/lib/social-types"

type Tab = "public" | "plan" | "list" | "keys"

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
})

function readImage(file: File, maxW: number, maxH: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const scale = Math.min(maxW / img.width, maxH / img.height, 1)
      const canvas = document.createElement("canvas")
      canvas.width = Math.max(1, Math.round(img.width * scale))
      canvas.height = Math.max(1, Math.round(img.height * scale))
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        URL.revokeObjectURL(url)
        reject(new Error("No canvas"))
        return
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL("image/jpeg", 0.72))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("Could not read image"))
    }
    img.src = url
  })
}

export default function SettingsDesk() {
  const { isLoaded, isSignedIn } = useUser()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>("public")
  const [data, setData] = useState<SettingsBundle | null>(null)
  const [saved, setSaved] = useState("")
  const [error, setError] = useState("")
  const [keyValue, setKeyValue] = useState("")
  const [provider, setProvider] = useState<KeyProvider>("openai")

  useEffect(() => {
    if (isLoaded && !isSignedIn) router.push("/signup")
  }, [isLoaded, isSignedIn, router])

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("tab")
    if (fromUrl === "public" || fromUrl === "plan" || fromUrl === "list" || fromUrl === "keys") {
      setTab(fromUrl)
    }
  }, [])

  const load = () => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((json: { settings?: SettingsBundle; error?: string }) => {
        if (json.settings) setData(json.settings)
        if (json.error) setError(json.error)
      })
      .catch(() => setError("Could not load settings."))
  }

  useEffect(() => {
    if (isSignedIn) load()
  }, [isSignedIn])

  const patch = async (body: Record<string, unknown>) => {
    setError("")
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const json = (await res.json()) as { settings?: SettingsBundle; error?: string }
    if (!res.ok || !json.settings) {
      setError(json.error ?? "Could not save.")
      return
    }
    setData(json.settings)
    setSaved("Saved.")
    setTimeout(() => setSaved(""), 1600)
  }

  const onFile = async (file: File, kind: "cover" | "avatar") => {
    try {
      const url = await readImage(file, kind === "cover" ? 1400 : 320, kind === "cover" ? 420 : 320)
      await patch(kind === "cover" ? { coverUrl: url } : { avatarUrl: url })
    } catch {
      setError("Could not read that image.")
    }
  }

  const saveKey = async () => {
    setError("")
    const res = await fetch("/api/settings/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, key: keyValue }),
    })
    const json = (await res.json()) as { error?: string }
    if (!res.ok) {
      setError(json.error ?? "Could not store key.")
      return
    }
    setKeyValue("")
    setSaved("Key stored. It never shows in full again.")
    load()
  }

  const dropKey = async (id: KeyProvider) => {
    await fetch("/api/settings/keys", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider: id }),
    })
    load()
  }

  if (!data) {
    return (
      <div className="page-max page-pad pt-[calc(var(--header-offset)+2rem)]">
        <p className="text-sm text-mist">{error || "Opening settings…"}</p>
      </div>
    )
  }

  const tabs: Array<{ id: Tab; label: string; icon: typeof UserRound }> = [
    { id: "public", label: "Public account", icon: UserRound },
    { id: "plan", label: "Plan", icon: Sparkles },
    { id: "list", label: "Generations", icon: List },
    { id: "keys", label: "API keys", icon: KeyRound },
  ]

  return (
    <div className="page-max page-pad min-w-0 pt-[calc(var(--header-offset)+2rem)] pb-12">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-saffron">Settings</p>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="font-display text-4xl font-semibold tracking-tight text-chalk">Your desk</h1>
        <Link
          href={`/u/${data.username}`}
          className="btn-press inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-chalk px-5 text-sm font-semibold text-ink"
        >
          Public account
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
      <p className="mt-3 max-w-xl text-sm text-mist">
        Edit the public wall, watch spend, and bring your own AI keys. Flatify uses your key when you turn that on — we never show the full secret again.
      </p>
      {saved ? <p className="mt-3 text-xs text-saffron">{saved}</p> : null}
      {error ? <p className="mt-3 text-xs text-coral">{error}</p> : null}

      <div className="mt-8 flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]" role="tablist">
        {tabs.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`btn-press inline-flex min-h-11 shrink-0 items-center gap-2 rounded-md px-4 text-sm font-semibold ${
                tab === item.id ? "bg-cobalt text-chalk" : "border border-chalk/15 text-mist hover:text-chalk"
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </button>
          )
        })}
      </div>

      {tab === "public" ? (
        <section className="mt-8">
          <div className="overflow-hidden border border-chalk/10">
            <label className="relative block h-36 cursor-pointer bg-slateink sm:h-44">
              {data.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data.coverUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-gradient-to-r from-cobalt/40 via-ink to-saffron/30" />
              )}
              <span className="absolute bottom-3 right-3 inline-flex min-h-11 items-center gap-2 rounded-md bg-ink/80 px-3 text-xs font-semibold text-chalk">
                <Camera className="h-4 w-4" aria-hidden="true" />
                Cover
              </span>
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) void onFile(file, "cover")
                }}
              />
            </label>
            <div className="relative px-5 pb-6 pt-10 sm:px-8">
              <label className="absolute -top-8 left-5 cursor-pointer sm:left-8">
                <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-ink bg-slateink">
                  {data.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={data.avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="font-display text-xl text-chalk">{data.displayName.slice(0, 1)}</span>
                  )}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) void onFile(file, "avatar")
                  }}
                />
              </label>
              <p className="font-mono text-[11px] text-mist">@{data.username} · click the photo or cover to change</p>
            </div>
          </div>

          <form
            className="mt-6 grid max-w-xl gap-4"
            onSubmit={(e) => {
              e.preventDefault()
              const form = new FormData(e.currentTarget)
              void patch({
                displayName: String(form.get("displayName") ?? ""),
                tagline: String(form.get("tagline") ?? ""),
                bio: String(form.get("bio") ?? ""),
                location: String(form.get("location") ?? ""),
                website: String(form.get("website") ?? ""),
              })
            }}
          >
            <Field id="displayName" label="Name" defaultValue={data.displayName} />
            <Field id="tagline" label="Tagline" defaultValue={data.tagline} maxLength={120} />
            <label className="block font-mono text-[11px] uppercase tracking-[0.16em] text-mist" htmlFor="bio">
              Bio
            </label>
            <textarea
              id="bio"
              name="bio"
              defaultValue={data.bio}
              rows={4}
              maxLength={400}
              className="w-full resize-none rounded-md border border-chalk/15 bg-slateink p-3 text-sm text-chalk"
            />
            <Field id="location" label="Location" defaultValue={data.location} />
            <Field id="website" label="Website" defaultValue={data.website} placeholder="https://" />
            <button
              type="submit"
              className="btn-press inline-flex min-h-11 items-center justify-center rounded-md bg-cobalt px-5 text-sm font-semibold text-chalk"
            >
              Save public information
            </button>
          </form>
        </section>
      ) : null}

      {tab === "plan" ? (
        <section className="mt-8">
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Credits left" value={`${data.creditsLeft}`} note={`${data.creditsUsed} used of ${data.creditsTotal}`} />
            <Stat label="Spent on Flatify" value={money.format(data.spentUsd)} note="Own-key runs bill $0 here" />
            <Stat label="Generations" value={`${data.totalGenerations}`} note={`${data.published} published`} />
          </div>
          <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.16em] text-mist">AI subscription</p>
          <div className="mt-3 grid gap-px bg-chalk/10 sm:grid-cols-2">
            {STUDIO_PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`bg-ink p-5 text-left ${data.plan === plan.id ? "ring-2 ring-inset ring-cobalt" : ""}`}
              >
                <p className="font-display text-xl font-semibold text-chalk">{plan.name}</p>
                <p className="mt-1 text-sm text-mist">{plan.blurb}</p>
                <p className="mt-3 font-display text-2xl text-chalk">
                  {plan.monthly === 0 ? "Free" : money.format(plan.monthly)}
                  {plan.monthly > 0 ? <span className="text-sm text-mist"> / mo</span> : null}
                </p>
                <p className="mt-1 font-mono text-[11px] text-saffron">{plan.credits.toLocaleString()} credits</p>
                {data.plan === plan.id ? (
                  <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-cobalt">Current</p>
                ) : null}
              </div>
            ))}
          </div>
          <Link href="/pricing" className="mt-6 inline-flex min-h-11 items-center text-sm text-mist hover:text-chalk">
            Change plan on Pricing →
          </Link>
        </section>
      ) : null}

      {tab === "list" ? (
        <section className="mt-8">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Total" value={`${data.totalGenerations}`} />
            <Stat label="Published" value={`${data.published}`} />
            <Stat label="Own-key runs" value={`${data.ownKeyRuns}`} />
            <Stat label="Spend" value={money.format(data.spentUsd)} />
          </div>
          <ul className="mt-8 divide-y divide-chalk/10 border-y border-chalk/10">
            {data.generations.length === 0 ? (
              <li className="py-6 text-sm text-mist">No generations yet. Run a still or clip on a desk.</li>
            ) : (
              data.generations.map((row) => (
                <li key={row.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-mono text-[11px] uppercase tracking-wider text-saffron">
                      {row.kind} · {row.provider}
                      {row.usedOwnKey ? " · your key" : ""}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm text-chalk">{row.prompt}</p>
                  </div>
                  <p className="shrink-0 font-mono text-[11px] text-mist">
                    {row.creditsCost} cr · {row.usedOwnKey ? "$0.00" : money.format(row.usdCents / 100)} ·{" "}
                    {formatDistanceToNow(new Date(row.createdAt), { addSuffix: true })}
                  </p>
                </li>
              ))
            )}
          </ul>
        </section>
      ) : null}

      {tab === "keys" ? (
        <section className="mt-8 max-w-xl">
          <p className="text-sm leading-relaxed text-mist">
            Bring your own API key. Flatify stores it encrypted, shows only the last four characters, and uses it on Images and Video when this switch is on. Those runs cost $0 on your Flatify bill — you pay the provider.
          </p>
          <label className="mt-6 flex min-h-11 items-center justify-between gap-4 border border-chalk/10 bg-slateink px-4">
            <span className="text-sm text-chalk">Use my keys for generation</span>
            <input
              type="checkbox"
              checked={data.useOwnKeys}
              onChange={(e) => void patch({ useOwnKeys: e.target.checked })}
              className="h-5 w-5 accent-cobalt"
            />
          </label>

          <div className="mt-6 grid gap-3">
            <label className="font-mono text-[11px] uppercase tracking-[0.16em] text-mist" htmlFor="provider">
              Provider
            </label>
            <select
              id="provider"
              value={provider}
              onChange={(e) => setProvider(e.target.value as KeyProvider)}
              className="min-h-11 rounded-md border border-chalk/15 bg-slateink px-3 text-sm text-chalk"
            >
              {KEY_PROVIDERS.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.label}
                </option>
              ))}
            </select>
            <label className="font-mono text-[11px] uppercase tracking-[0.16em] text-mist" htmlFor="api-key">
              Secret
            </label>
            <input
              id="api-key"
              type="password"
              autoComplete="off"
              value={keyValue}
              onChange={(e) => setKeyValue(e.target.value)}
              placeholder={KEY_PROVIDERS.find((row) => row.id === provider)?.hint}
              className="min-h-11 rounded-md border border-chalk/15 bg-slateink px-3 text-sm text-chalk"
            />
            <button
              type="button"
              onClick={() => void saveKey()}
              className="btn-press inline-flex min-h-11 items-center justify-center rounded-md bg-cobalt px-5 text-sm font-semibold text-chalk"
            >
              Store key
            </button>
          </div>

          <ul className="mt-8 divide-y divide-chalk/10 border-y border-chalk/10">
            {data.keys.length === 0 ? (
              <li className="py-5 text-sm text-mist">No keys stored yet.</li>
            ) : (
              data.keys.map((row) => (
                <li key={row.provider} className="flex items-center justify-between gap-3 py-4">
                  <div>
                    <p className="text-sm text-chalk">{row.label}</p>
                    <p className="font-mono text-[11px] text-mist">•••• {row.last4}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void dropKey(row.provider)}
                    className="text-sm text-coral hover:text-chalk"
                  >
                    Remove
                  </button>
                </li>
              ))
            )}
          </ul>
        </section>
      ) : null}
    </div>
  )
}

function Field({
  id,
  label,
  defaultValue,
  maxLength,
  placeholder,
}: {
  id: string
  label: string
  defaultValue: string
  maxLength?: number
  placeholder?: string
}) {
  return (
    <div>
      <label className="block font-mono text-[11px] uppercase tracking-[0.16em] text-mist" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        name={id}
        defaultValue={defaultValue}
        maxLength={maxLength}
        placeholder={placeholder}
        className="mt-2 w-full rounded-md border border-chalk/15 bg-slateink px-3 py-3 text-sm text-chalk"
      />
    </div>
  )
}

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="border border-chalk/10 bg-slateink p-4">
      <p className="font-mono text-[10px] uppercase tracking-wider text-mist">{label}</p>
      <p className="mt-2 font-display text-2xl font-semibold text-chalk">{value}</p>
      {note ? <p className="mt-1 text-xs text-mist">{note}</p> : null}
    </div>
  )
}
