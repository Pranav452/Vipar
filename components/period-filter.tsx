"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"

import { MONTH_NAMES } from "@/lib/period"
import { cn } from "@/lib/utils"

export interface PeriodOption {
  year: number
  months: number[]
}

// Global period filter — writes ?year=&month= to the URL; the server page
// recomputes every KPI, chart and table for the selection.
export function PeriodFilter({
  periods,
  year,
  month,
  className,
}: {
  periods: PeriodOption[]
  year: number | null
  month: number | null
  className?: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const apply = (y: number | null, m: number | null) => {
    const params = new URLSearchParams()
    if (y !== null) params.set("year", String(y))
    if (y !== null && m !== null) params.set("month", String(m))
    const qs = params.toString()
    startTransition(() => router.replace(qs ? `/dashboard?${qs}` : "/dashboard", { scroll: false }))
  }

  const activeYear = periods.find((p) => p.year === year)
  const selectCls =
    "h-8 rounded-full border border-foreground/10 bg-foreground/[0.03] px-3 text-xs focus:border-emerald-500/60 focus:outline-none"
  // Native <option> popups inherit the page foreground on some platforms,
  // turning white-on-white in dark mode — force readable colors explicitly.
  const optionStyle = { color: "#111", backgroundColor: "#fff" } as const

  return (
    <div className={cn("flex flex-wrap items-center gap-2", pending && "opacity-60", className)}>
      <span className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">Period</span>
      <select
        aria-label="Year"
        className={selectCls}
        value={year === null ? "all" : String(year)}
        onChange={(e) => apply(e.target.value === "all" ? null : Number(e.target.value), null)}
      >
        <option value="all" style={optionStyle}>
          All time
        </option>
        {periods.map((p) => (
          <option key={p.year} value={p.year} style={optionStyle}>
            {p.year}
          </option>
        ))}
      </select>
      <select
        aria-label="Month"
        className={cn(selectCls, year === null && "cursor-not-allowed opacity-40")}
        disabled={year === null}
        value={month === null ? "all" : String(month)}
        onChange={(e) => apply(year, e.target.value === "all" ? null : Number(e.target.value))}
      >
        <option value="all" style={optionStyle}>
          Whole year
        </option>
        {(activeYear?.months ?? []).map((m) => (
          <option key={m} value={m} style={optionStyle}>
            {MONTH_NAMES[m - 1]}
          </option>
        ))}
      </select>
      {year !== null && (
        <button
          onClick={() => apply(null, null)}
          className="rounded-full border border-emerald-500/30 px-2.5 py-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 uppercase transition-colors hover:bg-emerald-500/10"
        >
          Clear
        </button>
      )}
    </div>
  )
}
