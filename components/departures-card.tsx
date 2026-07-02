"use client"

import { useState } from "react"
import { Ship } from "lucide-react"

import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { DATA_AS_OF } from "@/lib/data"
import { fmtDateShort, vesselGroups } from "@/lib/stats"
import { titleCase } from "@/lib/ports"
import { cn } from "@/lib/utils"

export function DeparturesCard({ className }: { className?: string }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const upcoming = vesselGroups.filter((v) => !v.sailed)
  const departed = vesselGroups.filter((v) => v.sailed)

  return (
    <Card
      onMouseLeave={() => setHoveredIndex(null)}
      className={cn(
        "group relative gap-4 rounded-2xl border-foreground/[0.06] bg-foreground/[0.02] p-6 shadow-none backdrop-blur-sm transition-all duration-500 hover:border-foreground/[0.1] hover:bg-foreground/[0.04]",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Vessel schedule</span>
        </div>
        <span className="text-xs text-muted-foreground/60">{vesselGroups.length} vessels</span>
      </div>

      <div className="flex flex-col">
        {upcoming.map((v, index) => {
          const isHovered = hoveredIndex === index
          const overdue = v.etd !== undefined && v.etd < DATA_AS_OF
          return (
            <div
              key={v.vessel}
              onMouseEnter={() => setHoveredIndex(index)}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-300",
                isHovered && "bg-foreground/[0.05]",
              )}
            >
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors duration-300",
                  isHovered
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                    : "border-foreground/[0.08] bg-foreground/[0.03] text-muted-foreground/60",
                )}
              >
                <Ship className="h-3.5 w-3.5" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className={cn("truncate text-xs font-medium transition-colors", isHovered ? "text-foreground" : "text-foreground/85")}>
                  {v.vessel}
                </span>
                <span className="truncate text-[10px] text-muted-foreground/60">
                  {v.line ?? "—"} · {v.ports.map(titleCase).join(", ")}
                </span>
              </div>
              <div className="flex shrink-0 flex-col items-end">
                <span className={cn("text-xs font-medium tabular-nums", overdue ? "text-muted-foreground" : "text-foreground/90")}>
                  ETD {fmtDateShort(v.etd)}
                </span>
                <span className="text-[10px] tabular-nums text-muted-foreground/60">
                  {v.containers} cntrs · {v.workOrders} WO
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <Separator className="bg-foreground/[0.06]" />

      <div className="flex flex-col gap-1">
        <span className="px-3 text-[10px] tracking-widest text-muted-foreground/50 uppercase">Sailed</span>
        {departed.map((v) => (
          <div key={v.vessel} className="flex items-center gap-3 px-3 py-1.5">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500/70" />
            <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{v.vessel}</span>
            <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground/60">
              {v.containers} cntrs · SOB {fmtDateShort(v.etd)}
            </span>
          </div>
        ))}
      </div>

      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b from-foreground/[0.02] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
    </Card>
  )
}
