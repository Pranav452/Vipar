import type { Metadata } from "next"
import { Anchor, Bike, Container, Factory, Ship, Waves } from "lucide-react"

import { BarChartCard } from "@/components/charts/bar-chart-card"
import { BarListCard } from "@/components/charts/bar-list-card"
import { DonutCard } from "@/components/charts/donut-card"
import { KpiCard } from "@/components/charts/kpi-card"
import { DeparturesCard } from "@/components/departures-card"
import { PeriodFilter } from "@/components/period-filter"
import { ShipmentsTable } from "@/components/shipments-table"
import { SiteHeader } from "@/components/site-header"
import { TradeLanesCard } from "@/components/trade-lanes-card"
import { availablePeriods, inPeriod, periodFromSearchParams, periodLabel } from "@/lib/period"
import { computeStats, fmt, fmtDate } from "@/lib/stats"
import { loadDataset } from "@/lib/store"

export const metadata: Metadata = {
  title: "Dashboard · VIPAR by LINKS",
}

export const dynamic = "force-dynamic"

// Work orders are dated by stuffing date, falling back to ETD for rows not yet stuffed.
const woDate = (s: { stuffing?: string | null; etd?: string | null }) => s.stuffing ?? s.etd ?? null

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>
}) {
  const period = periodFromSearchParams(await searchParams)
  const dataset = await loadDataset()
  const periods = availablePeriods(dataset.shipments.map(woDate))
  const filtered = dataset.shipments.filter((s) => inPeriod(woDate(s), period))
  const stats = computeStats(filtered, dataset.asOf)

  const byStatus = Object.fromEntries(stats.statusCounts.map((s) => [s.status, s]))
  const sparkContainers = stats.stuffingByWeek.map((w) => w.containers)
  const sparkVehicles = stats.stuffingByWeek.map((w) => w.vehicles)

  const timeline = stats.stuffingTimeline.map((d) => ({
    label: d.label,
    value: d.containers,
    muted: d.planned,
    hint: `${d.label} · ${d.containers} cntrs / ${fmt(d.vehicles)} veh${d.planned ? " · planned" : ""}`,
  }))

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        {/* Title */}
        <div className="mb-8 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-[11px] font-medium tracking-widest text-muted-foreground/70 uppercase">
            <span>LINKS</span>
            <span className="text-muted-foreground/30">/</span>
            <span>Client · VIPAR</span>
          </div>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Export operations overview
              {period.year !== null && (
                <span className="text-emerald-600 dark:text-emerald-400"> · {periodLabel(period)}</span>
              )}
            </h1>
            <div className="flex flex-wrap items-center gap-4">
              <PeriodFilter periods={periods} year={period.year} month={period.month} />
              <span className="text-xs text-muted-foreground">
                Nhava Sheva (JNPT) origin · data as of {fmtDate(stats.asOf)}
              </span>
            </div>
          </div>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
          <KpiCard
            label="Work orders"
            value={fmt(stats.totals.workOrders)}
            icon={<Container />}
            sub={`${byStatus["sailed"].workOrders} sailed · ${byStatus["planned"].workOrders} planned`}
            accent
          />
          <KpiCard
            label="Vehicles"
            value={fmt(stats.totals.vehicles)}
            unit="units"
            icon={<Bike />}
            spark={sparkVehicles}
          />
          <KpiCard
            label="Containers"
            value={fmt(stats.totals.containers)}
            unit="40' HC"
            icon={<Ship />}
            spark={sparkContainers}
          />
          <KpiCard
            label="On water"
            value={fmt(byStatus["sailed"].containers)}
            unit="cntrs"
            icon={<Waves />}
            sub={`${byStatus["sailed"].workOrders} WO sailed with BL issued`}
            accent
          />
          <KpiCard
            label="At port / gated"
            value={fmt(byStatus["at-port"].containers)}
            unit="cntrs"
            icon={<Anchor />}
            sub={`${byStatus["at-port"].workOrders} WO awaiting vessel`}
          />
          <KpiCard
            label="Planned"
            value={fmt(byStatus["planned"].containers)}
            unit="cntrs"
            icon={<Factory />}
            sub={`${byStatus["planned"].workOrders} WO in stuffing plan`}
          />
        </div>

        {/* Globe + vessel schedule */}
        <div className="mt-4 grid gap-4 xl:grid-cols-[1.6fr_1fr]">
          <TradeLanesCard lanes={stats.lanes} />
          <DeparturesCard vessels={stats.vesselGroups} asOf={stats.asOf} />
        </div>

        {/* Stuffing timeline */}
        <div className="mt-4">
          <BarChartCard
            title="Container stuffing timeline"
            subtitle="Solid bars = stuffed · faint bars = planned"
            data={timeline}
            unit="cntrs"
            height={150}
            showEveryLabel={3}
          />
        </div>

        {/* Mix charts */}
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <DonutCard
            title="Cargo type mix"
            subtitle="by containers"
            data={stats.containersByCargo}
            unit="cntrs"
            centerLabel="containers"
          />
          <BarListCard
            title="Shipping lines"
            subtitle="containers booked"
            data={stats.containersByLine}
            unit="cntrs"
            live
          />
          <BarListCard
            title="Vehicle models"
            subtitle="units by model"
            data={stats.vehiclesByModel.filter((m) => m.value > 0)}
            maxItems={8}
          />
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <BarListCard
            title="Destination countries"
            subtitle="containers"
            data={stats.containersByCountry}
            unit="cntrs"
          />
          <DonutCard
            title="Loading plants"
            subtitle="by containers"
            data={stats.containersByPlant}
            unit="cntrs"
            centerLabel="containers"
          />
          <div className="flex flex-col gap-4">
            <BarListCard
              title="Transporters"
              subtitle="work orders handled"
              data={stats.workOrdersByTransporter}
              unit="WO"
              className="flex-1"
            />
            <BarListCard
              title="POL terminals"
              subtitle="containers gated"
              data={stats.containersByGate}
              unit="cntrs"
              className="flex-1"
            />
          </div>
        </div>

        {/* Weekly volume */}
        <div className="mt-4">
          <BarChartCard
            title="Weekly export volume"
            subtitle="containers per week (Mon start) · faint = planned"
            data={stats.stuffingByWeek.map((w) => ({
              label: w.label,
              value: w.containers,
              muted: w.planned,
              hint: `Wk of ${w.label} · ${w.containers} cntrs / ${fmt(w.vehicles)} veh${w.planned ? " · planned" : ""}`,
            }))}
            unit="cntrs"
            height={120}
          />
        </div>

        {/* Work orders table */}
        <div className="mt-4 scroll-mt-24" id="work-orders">
          <ShipmentsTable shipments={stats.withStatus} />
        </div>

        <p className="mt-8 text-center text-[11px] text-muted-foreground/50">
          Management dashboard for VIPAR · prepared by LINKS · data as of {fmtDate(stats.asOf)}
        </p>
      </main>
    </div>
  )
}
