import type { Metadata } from "next"
import { Archive } from "lucide-react"

import { SiteHeader } from "@/components/site-header"
import { TrackingClient, TrackingResultsView } from "@/components/tracking-client"
import { getSession } from "@/lib/auth"
import { latestTrackingRun } from "@/lib/tracking-store"

export const metadata: Metadata = {
  title: "Live Tracking · VIPAR by LINKS",
}

export const dynamic = "force-dynamic"

function fmtRunTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  })
}

export default async function TrackingPage() {
  const session = await getSession()
  const isStaff = session?.role === "uploader" || session?.role === "admin"
  const run = isStaff ? null : await latestTrackingRun()

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
              <span className="text-emerald-600 dark:text-emerald-400"> · ONE</span>
            </h1>
            <span className="text-xs text-muted-foreground">
              {isStaff
                ? "Live data from Ocean Network Express · paste booking numbers below"
                : "Container status from Ocean Network Express · updated by LINKS"}
            </span>
          </div>
        </div>

        {isStaff ? (
          <TrackingClient />
        ) : run ? (
          <TrackingResultsView
            allRows={run.rows}
            headline={run.label ?? "Tracking update"}
            sub={`Updated ${fmtRunTime(run.ran_at)} IST · ${run.bookings.length} bookings`}
          />
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-foreground/10 bg-foreground/[0.02] px-6 py-20 text-center">
            <Archive className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm font-medium text-foreground/80">No tracking update yet</p>
            <p className="max-w-sm text-xs text-muted-foreground">
              LINKS publishes container tracking updates here. Check back soon — the latest run will
              appear as soon as it&apos;s available.
            </p>
          </div>
        )}

        <p className="mt-8 text-center text-[11px] text-muted-foreground/50">
          Live tracking for VIPAR · prepared by LINKS · source: ecomm.one-line.com
        </p>
      </main>
    </div>
  )
}
