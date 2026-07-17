"use client"

import { useActionState, useMemo, useState } from "react"
import { Download, RadioTower, Search, Send, Ship } from "lucide-react"
import * as XLSX from "xlsx"

import { publishTrackingRun, type PublishState } from "@/app/dashboard/tracking/actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { TrackedContainer, TrackingResult, TrackingStatus } from "@/lib/one-tracking"
import { cn } from "@/lib/utils"

const STATUS_LABEL: Record<TrackingStatus, string> = {
  arrived: "Arrived POD",
  "on-water": "On water",
  origin: "At origin",
  "not-found": "Not found",
}

const STATUS_STYLES: Record<TrackingStatus, string> = {
  arrived: "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  "on-water": "border-sky-500/25 bg-sky-500/10 text-sky-600 dark:text-sky-400",
  origin: "border-foreground/10 bg-foreground/[0.04] text-muted-foreground",
  "not-found": "border-rose-500/25 bg-rose-500/10 text-rose-600 dark:text-rose-400",
}

const STATUS_DOT: Record<TrackingStatus, string> = {
  arrived: "bg-emerald-400",
  "on-water": "bg-sky-400 animate-pulse",
  origin: "bg-foreground/40",
  "not-found": "bg-rose-400",
}

const STATUS_TABS: (TrackingStatus | "all")[] = ["all", "on-water", "arrived", "origin", "not-found"]

function TrackingStatusBadge({ status }: { status: TrackingStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-medium", STATUS_STYLES[status])}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT[status])} />
      {STATUS_LABEL[status]}
    </Badge>
  )
}

const EXCEL_HEADERS = [
  "Booking No",
  "Container No",
  "Type/Size",
  "Weight",
  "Latest Event",
  "Latest Location",
  "Latest Event Time",
  "Vessel/Voyage",
  "POL",
  "POD",
  "POD Arrival (ETA/ATA)",
  "A/E",
  "Current Yard",
  "Status",
]

function downloadExcel(rows: TrackedContainer[]) {
  const data = rows.map((r) => [
    r.bookingNo, r.containerNo, r.typeSize, r.weight, r.latestEvent, r.latestLocation,
    r.latestTime, r.vessel, r.pol, r.pod, r.podEta, r.podEtaFlag, r.currentYard, STATUS_LABEL[r.status],
  ])
  const ws = XLSX.utils.aoa_to_sheet([EXCEL_HEADERS, ...data])
  ws["!cols"] = [14, 14, 11, 14, 44, 18, 17, 20, 22, 22, 20, 4, 30, 12].map((wch) => ({ wch }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "ONE Tracking")
  const stamp = new Date().toISOString().slice(0, 10)
  XLSX.writeFile(wb, `ONE_tracking_${stamp}.xlsx`)
}

/** Shared read-only results card: filters, tabs, Excel export, table. */
export function TrackingResultsView({
  allRows,
  headline,
  sub,
}: {
  allRows: TrackedContainer[]
  headline: string
  sub?: string
}) {
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<TrackingStatus | "all">("all")

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return allRows.filter((r) => {
      if (status !== "all" && r.status !== status) return false
      if (!q) return true
      return [r.bookingNo, r.containerNo, r.vessel, r.pol, r.pod, r.latestEvent, r.latestLocation, r.currentYard]
        .join(" ")
        .toLowerCase()
        .includes(q)
    })
  }, [allRows, query, status])

  const counts = useMemo(() => {
    const c: Record<TrackingStatus, number> = { arrived: 0, "on-water": 0, origin: 0, "not-found": 0 }
    for (const r of allRows) c[r.status]++
    return c
  }, [allRows])

  return (
    <Card className="group relative gap-5 overflow-hidden rounded-2xl border-foreground/[0.06] bg-foreground/[0.02] p-6 shadow-none backdrop-blur-sm transition-all duration-500 hover:border-foreground/[0.1]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{headline}</span>
          <span className="ml-1 text-xs tabular-nums text-muted-foreground/50">
            {rows.length} of {allRows.length}
          </span>
          {sub && <span className="ml-2 text-xs text-muted-foreground/60">{sub}</span>}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/50" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search booking, container, vessel…"
              className="h-9 w-full rounded-full border-foreground/10 bg-foreground/[0.03] pl-9 text-xs sm:w-72"
            />
          </div>
          <Button
            onClick={() => downloadExcel(allRows)}
            size="sm"
            variant="outline"
            className="gap-1.5 rounded-full border-foreground/15 bg-transparent px-4 text-xs hover:bg-foreground/[0.05]"
          >
            <Download className="h-3.5 w-3.5" />
            Excel
          </Button>
        </div>
      </div>

      <Tabs value={status} onValueChange={(v) => setStatus(v as TrackingStatus | "all")}>
        <TabsList className="h-9 rounded-full border border-foreground/[0.06] bg-foreground/[0.03] p-1">
          {STATUS_TABS.map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              className="rounded-full px-3 text-xs data-[state=active]:bg-foreground data-[state=active]:text-background dark:data-[state=active]:bg-foreground dark:data-[state=active]:text-background"
            >
              {tab === "all" ? "All" : STATUS_LABEL[tab]}
              {tab !== "all" && counts[tab] > 0 && (
                <span className="ml-1 tabular-nums opacity-60">{counts[tab]}</span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div data-lenis-prevent className="max-h-[540px] overflow-auto rounded-xl border border-foreground/[0.06]">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur">
            <TableRow className="border-foreground/[0.06] hover:bg-transparent">
              <TableHead className="text-[11px] tracking-wide text-muted-foreground/70 uppercase">Booking</TableHead>
              <TableHead className="text-[11px] tracking-wide text-muted-foreground/70 uppercase">Container</TableHead>
              <TableHead className="text-[11px] tracking-wide text-muted-foreground/70 uppercase">Latest event</TableHead>
              <TableHead className="text-[11px] tracking-wide text-muted-foreground/70 uppercase">Vessel</TableHead>
              <TableHead className="text-[11px] tracking-wide text-muted-foreground/70 uppercase">POL → POD</TableHead>
              <TableHead className="text-[11px] tracking-wide text-muted-foreground/70 uppercase">POD arrival</TableHead>
              <TableHead className="text-[11px] tracking-wide text-muted-foreground/70 uppercase">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r, i) => (
              <TableRow
                key={`${r.bookingNo}-${r.containerNo}-${i}`}
                className="border-foreground/[0.04] transition-colors hover:bg-foreground/[0.04]"
              >
                <TableCell className="font-mono text-xs text-foreground/90">{r.bookingNo}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-mono text-xs">{r.containerNo || "—"}</span>
                    {r.typeSize && <span className="text-[10px] text-muted-foreground/60">{r.typeSize}</span>}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex max-w-72 flex-col">
                    <span className="truncate text-xs" title={r.latestEvent}>{r.latestEvent || "—"}</span>
                    {r.latestTime && (
                      <span className="text-[10px] text-muted-foreground/60">
                        {r.latestLocation} · {r.latestTime}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{r.vessel || "—"}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-xs">{r.pol.split(",")[0] || "—"}</span>
                    <span className="text-[10px] text-muted-foreground/60">→ {r.pod.split(",")[0] || "—"}</span>
                  </div>
                </TableCell>
                <TableCell className={cn("text-xs tabular-nums", !r.podEta && "text-muted-foreground/40")}>
                  <div className="flex items-center gap-1.5">
                    {r.podEta || "—"}
                    {r.podEtaFlag && (
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.5 text-[9px] font-semibold",
                          r.podEtaFlag === "A"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                        )}
                      >
                        {r.podEtaFlag === "A" ? "ATA" : "ETA"}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <TrackingStatusBadge status={r.status} />
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-xs text-muted-foreground">
                  No containers match the current filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  )
}

/** Staff tool: paste bookings, fetch live from ONE, publish a snapshot for the client. */
export function TrackingClient() {
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<TrackingResult | null>(null)
  const [publishState, publishAction, publishing] = useActionState<PublishState, FormData>(publishTrackingRun, {})

  async function fetchTracking() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/tracking", { method: "POST", body: input })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || res.statusText)
      setResult(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fetch failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Paste card */}
      <Card className="gap-4 rounded-2xl border-foreground/[0.06] bg-foreground/[0.02] p-6 shadow-none backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <RadioTower className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Booking numbers
          </span>
          <span className="ml-1 text-xs text-muted-foreground/50">
            paste anything — whole sheet rows, comma lists, one per line
          </span>
        </div>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={"PNQG04579600  MUMG55300300  PNQG03792900…"}
          spellCheck={false}
          className="min-h-28 w-full resize-y rounded-xl border border-foreground/10 bg-foreground/[0.03] p-4 font-mono text-xs leading-relaxed text-foreground/90 placeholder:text-muted-foreground/40 focus:border-foreground/25 focus:outline-none"
        />

        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={fetchTracking}
            disabled={loading || !input.trim()}
            size="sm"
            className="gap-1.5 rounded-full px-5"
          >
            <Ship className="h-3.5 w-3.5" />
            {loading ? "Fetching live data…" : "Fetch tracking"}
          </Button>

          {result && (
            <form action={publishAction} className="flex items-center gap-2">
              <input type="hidden" name="result" value={JSON.stringify(result)} />
              <Input
                name="label"
                placeholder="Label (optional)"
                className="h-8 w-40 rounded-full border-foreground/10 bg-foreground/[0.03] text-xs"
              />
              <Button
                type="submit"
                disabled={publishing}
                size="sm"
                variant="outline"
                className="gap-1.5 rounded-full border-emerald-500/40 px-4 text-xs text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400"
              >
                <Send className="h-3.5 w-3.5" />
                {publishing ? "Publishing…" : "Publish to client"}
              </Button>
            </form>
          )}

          {error && <span className="text-xs text-rose-600 dark:text-rose-400">{error}</span>}
          {publishState.success && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400">
              Published — the client now sees this run.
            </span>
          )}
          {publishState.error && <span className="text-xs text-rose-600 dark:text-rose-400">{publishState.error}</span>}
          {result && !error && (
            <span className="text-xs tabular-nums text-muted-foreground">
              {result.bookings.length} booking{result.bookings.length === 1 ? "" : "s"} ·{" "}
              {result.rows.length - result.notFound.length} containers tracked
              {result.notFound.length > 0 && (
                <span className="text-rose-500/80"> · {result.notFound.length} not found</span>
              )}
            </span>
          )}
        </div>
      </Card>

      {result && <TrackingResultsView allRows={result.rows} headline="Live tracking results" />}
    </div>
  )
}
