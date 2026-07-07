import Image from "next/image"
import Link from "next/link"
import { ArrowRight, FileCheck2, Globe2, LockKeyhole, Ship, Timer } from "lucide-react"

import { Button } from "@/components/ui/button"
import { SiteHeader } from "@/components/site-header"
import { TradeGlobe } from "@/components/trade-globe"

const CAPABILITIES = [
  { label: "Vessel schedules", icon: Ship },
  { label: "Trade-lane tracking", icon: Globe2 },
  { label: "Cut-offs & filings", icon: Timer },
  { label: "BL & customs status", icon: FileCheck2 },
]

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="relative flex-1 overflow-hidden">
        {/* backdrop */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.2_0.01_285/40%),transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,oklch(1_0_0/2.5%)_1px,transparent_1px),linear-gradient(to_bottom,oklch(1_0_0/2.5%)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />

        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:py-10">
          <div className="relative z-10 flex flex-col items-start gap-7">
            <div className="flex items-center gap-2 rounded-full border border-foreground/10 bg-foreground/[0.03] px-4 py-1.5">
              <LockKeyhole className="h-3 w-3 text-emerald-500" />
              <span className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
                Private client portal
              </span>
            </div>

            <h1 className="text-4xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-6xl">
              Management dashboard
              <span className="block text-muted-foreground/60">for VIPAR, by LINKS.</span>
            </h1>

            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              A live view of VIPAR export operations out of Nhava Sheva — stuffing plans, vessel
              bookings, cut-offs, bills of lading and customs filings, managed end-to-end by LINKS.
              Operational data is visible to authorised VIPAR personnel only.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="group rounded-full px-6">
                <Link href="/login">
                  Client sign in
                  <ArrowRight className="ml-1 h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full border-foreground/15 bg-transparent px-6 hover:bg-foreground/[0.05]"
              >
                <Link href="mailto:mpcargolille@gmail.com">Contact LINKS</Link>
              </Button>
            </div>

            <div className="mt-4 grid w-full max-w-xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-foreground/[0.06] bg-foreground/[0.06] sm:grid-cols-4">
              {CAPABILITIES.map((cap) => (
                <div
                  key={cap.label}
                  className="flex flex-col gap-2 bg-background/90 p-4 transition-colors duration-300 hover:bg-foreground/[0.04]"
                >
                  <cap.icon className="h-4 w-4 text-emerald-500/80" />
                  <span className="text-[11px] leading-snug font-medium text-muted-foreground">{cap.label}</span>
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground/60">
              Access is restricted, device-bound and logged. Sign in to view live figures.
            </p>
          </div>

          <div className="relative -mx-8 lg:mx-0">
            <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_center,transparent_55%,var(--background)_95%)]" />
            <TradeGlobe className="max-w-[560px]" />
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
          <span className="text-xs text-muted-foreground/60">Prepared for VIPAR</span>
        </div>
      </footer>
    </div>
  )
}
