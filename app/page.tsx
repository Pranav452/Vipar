import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Bike, Container, Globe2, Ship } from "lucide-react"

import { Button } from "@/components/ui/button"
import { SiteHeader } from "@/components/site-header"
import { TradeGlobe } from "@/components/trade-globe"
import { DATA_AS_OF } from "@/lib/data"
import { STATUS_COUNTS, TOTALS, fmt, fmtDate, lanes } from "@/lib/stats"

const sailed = STATUS_COUNTS.find((s) => s.status === "sailed")!

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader showCta />

      <main className="relative flex-1 overflow-hidden">
        {/* backdrop */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.2_0.01_285/40%),transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,oklch(1_0_0/2.5%)_1px,transparent_1px),linear-gradient(to_bottom,oklch(1_0_0/2.5%)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />

        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:py-10">
          <div className="relative z-10 flex flex-col items-start gap-7">
            <div className="flex items-center gap-2 rounded-full border border-foreground/10 bg-foreground/[0.03] px-4 py-1.5">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              <span className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
                Client portal · Snapshot {fmtDate(DATA_AS_OF)}
              </span>
            </div>

            <h1 className="text-4xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-6xl">
              Management dashboard
              <span className="block text-muted-foreground/60">for VIPAR, by LINKS.</span>
            </h1>

            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Every VIPAR export work order in one live view — stuffing plans, vessel bookings,
              cut-offs, bills of lading and customs filings across {TOTALS.destinations} destination
              ports on three continents, all shipped out of Nhava Sheva and managed end-to-end by LINKS.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="group rounded-full px-6">
                <Link href="/dashboard">
                  Open dashboard
                  <ArrowRight className="ml-1 h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full border-foreground/15 bg-transparent px-6 hover:bg-foreground/[0.05]"
              >
                <Link href="/dashboard#work-orders">Browse work orders</Link>
              </Button>
            </div>

            <div className="mt-4 grid w-full max-w-xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-foreground/[0.06] bg-foreground/[0.06] sm:grid-cols-4">
              {[
                { label: "Work orders", value: fmt(TOTALS.workOrders), icon: Container },
                { label: "Vehicles", value: fmt(TOTALS.vehicles), icon: Bike },
                { label: "Containers", value: fmt(TOTALS.containers), icon: Ship },
                { label: "Countries", value: fmt(TOTALS.countries), icon: Globe2 },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="flex flex-col gap-1 bg-background/90 p-4 transition-colors duration-300 hover:bg-foreground/[0.04]"
                >
                  <span className="text-xl font-semibold tabular-nums">{stat.value}</span>
                  <span className="text-[10px] tracking-widest text-muted-foreground uppercase">{stat.label}</span>
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground/60">
              {sailed.workOrders} work orders already sailed · {fmt(sailed.containers)} containers on water ·{" "}
              {lanes.length} active trade lanes
            </p>
          </div>

          <div className="relative -mx-8 lg:mx-0">
            <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_center,transparent_55%,var(--background)_95%)]" />
            <TradeGlobe className="max-w-[560px]" />
            <div className="absolute right-2 bottom-6 z-20 hidden flex-col items-end gap-1 sm:flex">
              <span className="text-[10px] tracking-widest text-muted-foreground/60 uppercase">Live trade lanes</span>
              <span className="text-xs text-muted-foreground">Nhava Sheva → {lanes.length} ports</span>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-foreground/[0.06]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 sm:flex-row sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-7 items-center rounded-md bg-white px-2">
              <Image src="/links-logo.png" alt="LINKS" width={50} height={20} className="h-4 w-auto" />
            </span>
            <span className="text-xs text-muted-foreground">LINKS · Freight forwarding &amp; export operations</span>
          </div>
          <span className="text-xs text-muted-foreground/60">
            Prepared for VIPAR · Data as of {fmtDate(DATA_AS_OF)}
          </span>
        </div>
      </footer>
    </div>
  )
}
