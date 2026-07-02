import Image from "next/image"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DATA_AS_OF } from "@/lib/data"
import { fmtDate } from "@/lib/stats"

export function SiteHeader({ showCta = false }: { showCta?: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b border-foreground/[0.06] bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-9 items-center rounded-lg bg-white px-2.5">
            <Image src="/links-logo.png" alt="LINKS" width={70} height={28} className="h-6 w-auto" priority />
          </span>
          <span className="hidden flex-col leading-tight sm:flex">
            <span className="text-sm font-semibold tracking-tight">VIPAR Operations</span>
            <span className="text-[10px] tracking-widest text-muted-foreground uppercase">Managed by LINKS</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className="hidden gap-1.5 rounded-full border-foreground/10 bg-foreground/[0.03] px-3 py-1 text-[11px] font-normal text-muted-foreground md:inline-flex"
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            Data as of {fmtDate(DATA_AS_OF)}
          </Badge>
          {showCta && (
            <Button asChild size="sm" className="rounded-full px-4">
              <Link href="/dashboard">Open dashboard</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
