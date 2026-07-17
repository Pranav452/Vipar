"use client"

import { useState } from "react"
import { MoveRight } from "lucide-react"

import { Card } from "@/components/ui/card"
import { TradeGlobe } from "@/components/trade-globe"
import type { Lane } from "@/lib/stats"
import { ORIGIN, titleCase } from "@/lib/ports"
import { cn } from "@/lib/utils"

export function TradeLanesCard({ lanes, className }: { lanes: Lane[]; className?: string }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const max = Math.max(...lanes.map((l) => l.containers), 1)

  return (
    <Card
      className={cn(
        "group relative gap-0 overflow-hidden rounded-2xl border-foreground/[0.06] bg-foreground/[0.02] p-0 shadow-none backdrop-blur-sm transition-all duration-500 hover:border-foreground/[0.1]",
        className,
      )}
    >
      <div className="grid gap-0 lg:grid-cols-[1.1fr_1fr]">
        <div className="relative flex min-h-[380px] items-center justify-center overflow-hidden p-4">
          <div className="absolute top-6 left-6 z-10 flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Trade lanes</span>
          </div>
          <div className="absolute bottom-6 left-6 z-10 flex flex-col">
            <span className="text-[10px] tracking-widest text-muted-foreground/60 uppercase">Port of loading</span>
            <span className="text-sm font-medium">{ORIGIN.label}</span>
          </div>
          <TradeGlobe lanes={lanes} className="max-w-[440px] translate-y-4" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background/60 to-transparent" />
        </div>

        <div
          className="flex flex-col justify-center gap-1 border-t border-foreground/[0.06] p-6 lg:border-t-0 lg:border-l"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {lanes.map((lane, index) => {
            const isHovered = hoveredIndex === index
            const isAnyHovered = hoveredIndex !== null
            return (
              <div
                key={lane.port}
                onMouseEnter={() => setHoveredIndex(index)}
                className={cn(
                  "flex cursor-pointer flex-col gap-1.5 rounded-xl px-3 py-2.5 transition-all duration-300",
                  isHovered && "bg-foreground/[0.05]",
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2 text-xs">
                    <span className="text-muted-foreground/50">Nhava Sheva</span>
                    <MoveRight
                      className={cn(
                        "h-3 w-3 shrink-0 transition-colors duration-300",
                        isHovered ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground/30",
                      )}
                    />
                    <span className={cn("truncate font-medium transition-colors", isHovered ? "text-foreground" : "text-foreground/80")}>
                      {titleCase(lane.port)}
                    </span>
                    <span className="hidden truncate text-[10px] text-muted-foreground/50 xl:inline">
                      {lane.countries.join(" · ")}
                    </span>
                  </div>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    <span className={cn("font-medium transition-colors", isHovered && "text-foreground")}>
                      {lane.containers}
                    </span>{" "}
                    cntrs
                    <span className="ml-2 text-muted-foreground/50">{lane.workOrders} WO</span>
                  </span>
                </div>
                <div className="h-1 w-full overflow-hidden rounded-full bg-foreground/[0.06]">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      isHovered ? "bg-emerald-500" : isAnyHovered ? "bg-foreground/20" : "bg-foreground/35",
                    )}
                    style={{ width: `${(lane.containers / max) * 100}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b from-foreground/[0.02] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
    </Card>
  )
}
