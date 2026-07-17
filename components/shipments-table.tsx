"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"

import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { StatusBadge } from "@/components/status-badge"
import { STATUS_LABEL, type Status } from "@/lib/data"
import { fmtDateShort, type ShipmentWithStatus } from "@/lib/stats"
import { titleCase } from "@/lib/ports"
import { cn } from "@/lib/utils"

const STATUS_TABS: (Status | "all")[] = ["all", "sailed", "at-port", "booked", "planned"]
const PAGE_SIZE = 15

export function ShipmentsTable({ shipments }: { shipments: ShipmentWithStatus[] }) {
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<Status | "all">("all")
  const [country, setCountry] = useState("all")
  const [page, setPage] = useState(0)

  const countries = useMemo(
    () => [...new Set(shipments.map((s) => s.country).filter(Boolean))].sort(),
    [shipments],
  )

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return shipments.filter((s) => {
      if (status !== "all" && s.status !== status) return false
      if (country !== "all" && s.country !== country) return false
      if (!q) return true
      const haystack = [s.wo, s.model, s.vessel, s.booking, s.blNo, s.po, s.port, s.country, ...(s.containers ?? [])]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [shipments, query, status, country])

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount - 1)
  const pageRows = rows.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE)

  return (
    <Card className="group relative gap-5 overflow-hidden rounded-2xl border-foreground/[0.06] bg-foreground/[0.02] p-6 shadow-none backdrop-blur-sm transition-all duration-500 hover:border-foreground/[0.1]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Work orders</span>
          <span className="ml-1 text-xs tabular-nums text-muted-foreground/50">
            {rows.length} of {shipments.length}
          </span>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/50" />
            <Input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(0); }}
              placeholder="Search WO, vessel, container, BL…"
              className="h-9 w-full rounded-full border-foreground/10 bg-foreground/[0.03] pl-9 text-xs sm:w-64"
            />
          </div>
          <Select value={country} onValueChange={(v) => { setCountry(v); setPage(0); }}>
            <SelectTrigger size="sm" className="h-9 w-full rounded-full border-foreground/10 bg-foreground/[0.03] text-xs sm:w-40">
              <SelectValue placeholder="Country" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All countries</SelectItem>
              {countries.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={status} onValueChange={(v) => { setStatus(v as Status | "all"); setPage(0); }}>
        <TabsList className="h-9 rounded-full border border-foreground/[0.06] bg-foreground/[0.03] p-1">
          {STATUS_TABS.map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              className="rounded-full px-3 text-xs data-[state=active]:bg-foreground data-[state=active]:text-background dark:data-[state=active]:bg-foreground dark:data-[state=active]:text-background"
            >
              {tab === "all" ? "All" : STATUS_LABEL[tab]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div data-lenis-prevent className="max-h-[540px] overflow-auto rounded-xl border border-foreground/[0.06]">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur">
            <TableRow className="border-foreground/[0.06] hover:bg-transparent">
              <TableHead className="text-[11px] tracking-wide text-muted-foreground/70 uppercase">WO</TableHead>
              <TableHead className="text-[11px] tracking-wide text-muted-foreground/70 uppercase">Destination</TableHead>
              <TableHead className="text-[11px] tracking-wide text-muted-foreground/70 uppercase">Model</TableHead>
              <TableHead className="text-right text-[11px] tracking-wide text-muted-foreground/70 uppercase">Units</TableHead>
              <TableHead className="text-right text-[11px] tracking-wide text-muted-foreground/70 uppercase">Cntrs</TableHead>
              <TableHead className="text-[11px] tracking-wide text-muted-foreground/70 uppercase">Type</TableHead>
              <TableHead className="text-[11px] tracking-wide text-muted-foreground/70 uppercase">Vessel / Line</TableHead>
              <TableHead className="text-[11px] tracking-wide text-muted-foreground/70 uppercase">Stuffing</TableHead>
              <TableHead className="text-[11px] tracking-wide text-muted-foreground/70 uppercase">ETD</TableHead>
              <TableHead className="text-[11px] tracking-wide text-muted-foreground/70 uppercase">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.map((s) => (
              <TableRow
                key={s.wo}
                className="border-foreground/[0.04] transition-colors hover:bg-foreground/[0.04]"
              >
                <TableCell className="font-mono text-xs text-foreground/90">{s.wo}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-xs font-medium">{titleCase(s.port || "—")}</span>
                    <span className="text-[10px] text-muted-foreground/60">{s.country || ""}</span>
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{s.model}</TableCell>
                <TableCell className="text-right text-xs tabular-nums">{s.qty ? s.qty.toLocaleString("en-IN") : "—"}</TableCell>
                <TableCell className="text-right text-xs tabular-nums">{s.cont || "—"}</TableCell>
                <TableCell>
                  <span className="rounded-full border border-foreground/10 bg-foreground/[0.04] px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {s.cargo}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex max-w-44 flex-col">
                    <span className="truncate text-xs">{s.vessel ?? "—"}</span>
                    {s.line && <span className="text-[10px] text-muted-foreground/60">{s.line}</span>}
                  </div>
                </TableCell>
                <TableCell className={cn("text-xs tabular-nums", !s.stuffing && "text-muted-foreground/40")}>
                  {fmtDateShort(s.stuffing)}
                </TableCell>
                <TableCell className={cn("text-xs tabular-nums", !s.etd && "text-muted-foreground/40")}>
                  {fmtDateShort(s.etd)}
                </TableCell>
                <TableCell>
                  <StatusBadge status={s.status} className="text-[10px]" />
                </TableCell>
              </TableRow>
            ))}
            {pageRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} className="h-24 text-center text-xs text-muted-foreground">
                  No work orders match the current filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {pageCount > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs tabular-nums text-muted-foreground/60">
            Rows {safePage * PAGE_SIZE + 1}–{Math.min((safePage + 1) * PAGE_SIZE, rows.length)} of {rows.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(0, safePage - 1))}
              disabled={safePage === 0}
              className="rounded-full border border-foreground/15 bg-foreground/[0.03] px-3 py-1 text-xs transition-colors hover:bg-foreground/[0.08] disabled:cursor-not-allowed disabled:opacity-30"
            >
              ← Prev
            </button>
            <span className="px-1 text-xs tabular-nums text-muted-foreground">
              {safePage + 1} / {pageCount}
            </span>
            <button
              onClick={() => setPage(Math.min(pageCount - 1, safePage + 1))}
              disabled={safePage >= pageCount - 1}
              className="rounded-full border border-foreground/15 bg-foreground/[0.03] px-3 py-1 text-xs transition-colors hover:bg-foreground/[0.08] disabled:cursor-not-allowed disabled:opacity-30"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </Card>
  )
}
