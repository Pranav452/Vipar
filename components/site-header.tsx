import Image from "next/image"
import Link from "next/link"
import { LogOut } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { logout } from "@/app/login/actions"
import { AnimatedThemeToggle } from "@/components/theme-toggle"
import { getSession } from "@/lib/auth"
import { fmtDate } from "@/lib/stats"
import { loadDataset } from "@/lib/store"

export async function SiteHeader() {
  const session = await getSession()
  const dataset = session ? await loadDataset() : null

  return (
    <header className="sticky top-0 z-40 border-b border-foreground/[0.06] bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-9 items-center rounded-lg bg-white px-2.5">
              <Image src="/links-logo.png" alt="LINKS" width={70} height={28} className="h-6 w-auto" priority />
            </span>
            <span className="hidden flex-col leading-tight sm:flex">
              <span className="text-sm font-semibold tracking-tight">VIPAR Operations</span>
              <span className="text-[10px] tracking-widest text-muted-foreground uppercase">Managed by LINKS</span>
            </span>
          </Link>

          {session && (
            <nav className="hidden items-center gap-1 md:flex">
              <Link
                href="/dashboard"
                className="rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-foreground/[0.05] hover:text-foreground"
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard/tracking"
                className="rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-foreground/[0.05] hover:text-foreground"
              >
                Live tracking
              </Link>
              {(session.role === "uploader" || session.role === "admin") && (
                <Link
                  href="/admin/upload"
                  className="rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-foreground/[0.05] hover:text-foreground"
                >
                  Upload data
                </Link>
              )}
              {session.role === "admin" && (
                <Link
                  href="/admin"
                  className="rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-foreground/[0.05] hover:text-foreground"
                >
                  Admin panel
                </Link>
              )}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-3">
          {session && dataset && (
            <Badge
              variant="outline"
              className="hidden gap-1.5 rounded-full border-foreground/10 bg-foreground/[0.03] px-3 py-1 text-[11px] font-normal text-muted-foreground md:inline-flex"
            >
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              Data as of {fmtDate(dataset.asOf)}
            </Badge>
          )}

          <AnimatedThemeToggle className="rounded-full border border-foreground/15 text-muted-foreground hover:border-foreground/30 hover:text-foreground" />

          {session ? (
            <form action={logout}>
              <Button
                type="submit"
                size="sm"
                variant="outline"
                className="gap-1.5 rounded-full border-foreground/15 bg-transparent px-4 text-xs hover:bg-foreground/[0.05]"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </Button>
            </form>
          ) : (
            <Button asChild size="sm" className="rounded-full px-4">
              <Link href="/login">Client sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
