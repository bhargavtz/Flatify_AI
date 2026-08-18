"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

const KEY = "flatify-cookie-ok"

export default function CookieBanner() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    try {
      setOpen(window.localStorage.getItem(KEY) !== "1")
    } catch {
      setOpen(false)
    }
  }, [])

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
            } catch {
              /* ignore */
            }
            setOpen(false)
          }}
        >
          OK
        </button>
      </div>
    </div>
  )
}
