import type { Metadata } from "next"

import { SiteHeader } from "@/components/site-header"
import { TrackingClient } from "@/components/tracking-client"

export const metadata: Metadata = {
  title: "Live Tracking · VIPAR by LINKS",
}

export default function TrackingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        <div className="mb-8 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-[11px] font-medium tracking-widest text-muted-foreground/70 uppercase">
            <span>LINKS</span>
            <span className="text-muted-foreground/30">/</span>
            <span>Client · VIPAR</span>
          </div>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Live container tracking
              <span className="text-emerald-400"> · ONE</span>
            </h1>
            <span className="text-xs text-muted-foreground">
              Live data from Ocean Network Express · paste booking numbers below
            </span>
          </div>
        </div>

        <TrackingClient />

        <p className="mt-8 text-center text-[11px] text-muted-foreground/50">
          Live tracking for VIPAR · prepared by LINKS · source: ecomm.one-line.com
        </p>
      </main>
    </div>
  )
}
