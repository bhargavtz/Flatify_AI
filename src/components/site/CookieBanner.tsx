"use client"

import { useSyncExternalStore } from "react"
import Link from "next/link"

const KEY = "flatify-cookie-ok"

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback)
  return () => window.removeEventListener("storage", callback)
}

function getSnapshot() {
  try {
    return window.localStorage.getItem(KEY) !== "1"
  } catch {
    return false
  }
}

function getServerSnapshot() {
  return false
}

export default function CookieBanner() {
  const open = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  if (!open) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] border-t border-chalk/10 bg-ink/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-mist backdrop-blur">
      <div className="page-max flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-snug">
          We use session cookies so you can stay signed in. See{" "}
          <Link href="/cookies" className="text-saffron hover:text-chalk">
            Cookies
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-saffron hover:text-chalk">
            Privacy
          </Link>
          .
        </p>
        <button
          type="button"
          className="btn-press inline-flex min-h-11 shrink-0 items-center justify-center rounded-md bg-cobalt px-4 text-sm font-semibold text-chalk"
          onClick={() => {
            try {
              window.localStorage.setItem(KEY, "1")
              window.dispatchEvent(new Event("storage"))
            } catch {
              /* ignore */
            }
          }}
        >
          OK
        </button>
      </div>
    </div>
  )
}
