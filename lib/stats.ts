import {
  STATUS_LABEL,
  shipmentStatus,
  type Shipment,
  type Status,
} from "./data"
import { PORT_COORDS } from "./ports"

export interface NameValue {
  name: string
  value: number
}

const num = new Intl.NumberFormat("en-IN")

export function fmt(n: number): string {
  return num.format(n)
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

export function fmtDate(iso?: string | null): string {
  if (!iso) return "—"
  const [y, m, d] = iso.split("-").map(Number)
  return `${String(d).padStart(2, "0")} ${MONTHS[m - 1]} ${y}`
}

export function fmtDateShort(iso?: string | null): string {
  if (!iso) return "—"
  const [, m, d] = iso.split("-").map(Number)
  return `${String(d).padStart(2, "0")} ${MONTHS[m - 1]}`
}

export type ShipmentWithStatus = Shipment & { status: Status }

export interface DayPoint {
  date: string
  label: string
  containers: number
  vehicles: number
  planned: boolean
}

export interface WeekPoint {
  week: string
  label: string
  containers: number
  vehicles: number
  planned: boolean
}

export interface Lane {
  port: string
  countries: string[]
  coords: [number, number]
  workOrders: number
  containers: number
  vehicles: number
  sailed: number
}

export interface VesselGroup {
  vessel: string
  line?: string
  etd?: string
  sob?: string
  ports: string[]
  workOrders: number
  containers: number
  sailed: boolean
}

export interface StatusCount {
  status: Status
  label: string
  workOrders: number
  containers: number
  vehicles: number
}

export interface DashboardStats {
  asOf: string
  withStatus: ShipmentWithStatus[]
  totals: {
    workOrders: number
    vehicles: number
    containers: number
    destinations: number
    countries: number
    vessels: number
    hazShipments: number
  }
  statusCounts: StatusCount[]
  containersByCountry: NameValue[]
  vehiclesByModel: NameValue[]
  containersByLine: NameValue[]
  containersByCargo: NameValue[]
  containersByPlant: NameValue[]
  workOrdersByTransporter: NameValue[]
  containersByGate: NameValue[]
  stuffingTimeline: DayPoint[]
  stuffingByWeek: WeekPoint[]
  lanes: Lane[]
  vesselGroups: VesselGroup[]
}

function groupSum(
  rows: Shipment[],
  key: (s: Shipment) => string | undefined,
  value: (s: Shipment) => number,
): NameValue[] {
  const map = new Map<string, number>()
  for (const s of rows) {
    const k = key(s)
    if (!k) continue
    map.set(k, (map.get(k) ?? 0) + value(s))
  }
  return [...map.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
}

export function computeStats(shipments: Shipment[], asOf: string): DashboardStats {
  const withStatus: ShipmentWithStatus[] = shipments.map((s) => ({ ...s, status: shipmentStatus(s) }))

  const totals = {
    workOrders: shipments.length,
    vehicles: shipments.reduce((acc, s) => acc + s.qty, 0),
    containers: shipments.reduce((acc, s) => acc + s.cont, 0),
    destinations: new Set(shipments.map((s) => s.port).filter(Boolean)).size,
    countries: new Set(shipments.map((s) => s.country).filter(Boolean)).size,
    vessels: new Set(shipments.map((s) => s.vessel).filter(Boolean)).size,
    hazShipments: shipments.filter((s) => s.haz).length,
  }

  const statusCounts: StatusCount[] = (["sailed", "at-port", "booked", "planned"] as Status[]).map(
    (status) => {
      const rows = withStatus.filter((s) => s.status === status)
      return {
        status,
        label: STATUS_LABEL[status],
        workOrders: rows.length,
        containers: rows.reduce((acc, s) => acc + s.cont, 0),
        vehicles: rows.reduce((acc, s) => acc + s.qty, 0),
      }
    },
  )

  // Daily stuffing timeline
  const dayMap = new Map<string, { containers: number; vehicles: number }>()
  for (const s of shipments) {
    if (!s.stuffing) continue
    const cur = dayMap.get(s.stuffing) ?? { containers: 0, vehicles: 0 }
    cur.containers += s.cont
    cur.vehicles += s.qty
    dayMap.set(s.stuffing, cur)
  }
  const stuffingTimeline: DayPoint[] = [...dayMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({
      date,
      label: fmtDateShort(date),
      containers: v.containers,
      vehicles: v.vehicles,
      planned: date > asOf,
    }))

  // Weekly buckets (Monday start, UTC)
  const weekMap = new Map<string, { containers: number; vehicles: number }>()
  for (const s of shipments) {
    if (!s.stuffing) continue
    const [y, m, d] = s.stuffing.split("-").map(Number)
    const dt = new Date(Date.UTC(y, m - 1, d))
    const day = dt.getUTCDay() === 0 ? 7 : dt.getUTCDay()
    dt.setUTCDate(dt.getUTCDate() - (day - 1))
    const key = dt.toISOString().slice(0, 10)
    const cur = weekMap.get(key) ?? { containers: 0, vehicles: 0 }
    cur.containers += s.cont
    cur.vehicles += s.qty
    weekMap.set(key, cur)
  }
  const stuffingByWeek: WeekPoint[] = [...weekMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, v]) => ({
      week,
      label: fmtDateShort(week),
      containers: v.containers,
      vehicles: v.vehicles,
      planned: week > asOf,
    }))

  // Trade lanes
  const laneMap = new Map<string, Lane>()
  for (const s of withStatus) {
    if (!s.port || !PORT_COORDS[s.port]) continue
    const lane =
      laneMap.get(s.port) ??
      ({
        port: s.port,
        countries: [],
        coords: PORT_COORDS[s.port],
        workOrders: 0,
        containers: 0,
        vehicles: 0,
        sailed: 0,
      } as Lane)
    lane.workOrders += 1
    lane.containers += s.cont
    lane.vehicles += s.qty
    if (s.status === "sailed") lane.sailed += 1
    if (s.country && !lane.countries.includes(s.country)) lane.countries.push(s.country)
    laneMap.set(s.port, lane)
  }
  const lanes = [...laneMap.values()].sort((a, b) => b.containers - a.containers)

  // Vessel groupings
  const vesselMap = new Map<string, VesselGroup>()
  for (const s of withStatus) {
    if (!s.vessel) continue
    const g =
      vesselMap.get(s.vessel) ??
      ({
        vessel: s.vessel,
        line: s.line,
        etd: s.etd,
        ports: [],
        workOrders: 0,
        containers: 0,
        sailed: true,
      } as VesselGroup)
    g.workOrders += 1
    g.containers += s.cont
    if (s.etd && (!g.etd || s.etd > g.etd)) g.etd = s.etd
    if (s.sob && (!g.sob || s.sob > g.sob)) g.sob = s.sob
    if (s.port && !g.ports.includes(s.port)) g.ports.push(s.port)
    if (s.status !== "sailed") g.sailed = false
    vesselMap.set(s.vessel, g)
  }
  const vesselGroups = [...vesselMap.values()].sort((a, b) =>
    (a.etd ?? "9999").localeCompare(b.etd ?? "9999"),
  )

  return {
    asOf,
    withStatus,
    totals,
    statusCounts,
    containersByCountry: groupSum(shipments, (s) => s.country, (s) => s.cont),
    vehiclesByModel: groupSum(shipments, (s) => s.model, (s) => s.qty),
    containersByLine: groupSum(shipments, (s) => s.line, (s) => s.cont),
    containersByCargo: groupSum(shipments, (s) => s.cargo, (s) => s.cont),
    containersByPlant: groupSum(shipments, (s) => s.plant, (s) => s.cont),
    workOrdersByTransporter: groupSum(shipments, (s) => s.transporter, () => 1),
    containersByGate: groupSum(shipments, (s) => s.polGate, (s) => s.cont),
    stuffingTimeline,
    stuffingByWeek,
    lanes,
    vesselGroups,
  }
}
