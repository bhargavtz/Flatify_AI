"use client"

import { SignUp } from "@clerk/nextjs"
import { dark } from "@clerk/themes"
import { BrandMark } from "@/components/BrandMark"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import IdentityBoards from "@/components/landing/IdentityBoards"

export default function SignupPage() {
  return (
    <div className="grid min-h-dvh min-w-0 overflow-x-hidden bg-ink text-chalk lg:grid-cols-2">
      <div className="relative hidden overflow-hidden border-r border-chalk/10 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <Link href="/" className="inline-flex items-center gap-2.5" translate="no">
          <BrandMark size={32} />
          <span className="font-display text-lg font-semibold">Flatify</span>
        </Link>
        <IdentityBoards compact />
        <p className="max-w-sm font-display text-2xl font-semibold leading-tight text-balance">
        Start with a still. Leave with a film.
        </p>
      </div>

      <div className="relative flex min-w-0 flex-col items-center justify-center px-5 pb-10 pt-24">
        <Link
          href="/"
          className="absolute left-5 top-[max(1.25rem,env(safe-area-inset-top,0px))] inline-flex min-h-11 items-center gap-2 text-sm text-mist hover:text-chalk lg:left-8 lg:top-8"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Home
        </Link>

        <div className="mb-8 flex flex-col items-center lg:hidden">
          <BrandMark size={36} />
          <p className="mt-3 font-display text-xl font-semibold">Flatify</p>
        </div>

        <p className="mb-6 text-center text-sm text-mist">Create your studio account</p>

        <div className="w-full max-w-[min(28rem,100%)] overflow-x-hidden border border-chalk/10 bg-slateink p-2">
          <SignUp
            routing="path"
            path="/signup"
            appearance={{
              baseTheme: dark,
              elements: {
                card: "bg-transparent shadow-none p-4 w-full",
                headerTitle: "text-chalk font-display font-semibold text-xl text-center",
                headerSubtitle: "text-mist text-xs text-center",
                socialButtonsBlockButton:
                  "bg-ink border-chalk/15 text-chalk hover:border-cobalt text-xs font-semibold rounded-md",
                formButtonPrimary:
                  "bg-cobalt hover:bg-[#4A70FF] text-chalk text-xs font-semibold rounded-md",
                formFieldInput:
                  "bg-ink border-chalk/15 text-chalk text-xs rounded-md focus:border-cobalt",
                footerActionLink: "text-cobalt hover:text-chalk text-xs font-semibold",
                dividerLine: "bg-chalk/10",
                dividerText: "text-mist text-xs",
              },
            }}
          />
        </div>
      </div>
    </div>
  )
}
