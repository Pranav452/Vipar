import {
  DATA_AS_OF,
  SHIPMENTS,
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

export function fmtDate(iso?: string): string {
  if (!iso) return "—"
  const [y, m, d] = iso.split("-").map(Number)
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  return `${String(d).padStart(2, "0")} ${months[m - 1]} ${y}`
}

export function fmtDateShort(iso?: string): string {
  if (!iso) return "—"
  const [, m, d] = iso.split("-").map(Number)
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  return `${String(d).padStart(2, "0")} ${months[m - 1]}`
}

export const withStatus = SHIPMENTS.map((s) => ({ ...s, status: shipmentStatus(s) }))

export type ShipmentWithStatus = Shipment & { status: Status }

// ---- Headline totals -------------------------------------------------------

export const TOTALS = {
  workOrders: SHIPMENTS.length,
  vehicles: SHIPMENTS.reduce((acc, s) => acc + s.qty, 0),
  containers: SHIPMENTS.reduce((acc, s) => acc + s.cont, 0),
  destinations: new Set(SHIPMENTS.map((s) => s.port).filter(Boolean)).size,
  countries: new Set(SHIPMENTS.map((s) => s.country).filter(Boolean)).size,
  vessels: new Set(SHIPMENTS.map((s) => s.vessel).filter(Boolean)).size,
  hazShipments: SHIPMENTS.filter((s) => s.haz).length,
}

export const STATUS_COUNTS: { status: Status; label: string; workOrders: number; containers: number; vehicles: number }[] = (
  ["sailed", "at-port", "booked", "planned"] as Status[]
).map((status) => {
  const rows = withStatus.filter((s) => s.status === status)
  return {
    status,
    label: STATUS_LABEL[status],
    workOrders: rows.length,
    containers: rows.reduce((acc, s) => acc + s.cont, 0),
    vehicles: rows.reduce((acc, s) => acc + s.qty, 0),
  }
})

// ---- Grouping helpers ------------------------------------------------------

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

export const containersByCountry = groupSum(SHIPMENTS, (s) => s.country, (s) => s.cont)
export const vehiclesByCountry = groupSum(SHIPMENTS, (s) => s.country, (s) => s.qty)
export const containersByPort = groupSum(SHIPMENTS, (s) => s.port, (s) => s.cont)
export const vehiclesByModel = groupSum(SHIPMENTS, (s) => s.model, (s) => s.qty)
export const containersByLine = groupSum(SHIPMENTS, (s) => s.line, (s) => s.cont)
export const shipmentsByLine = groupSum(SHIPMENTS, (s) => s.line, () => 1)
export const containersByCargo = groupSum(SHIPMENTS, (s) => s.cargo, (s) => s.cont)
export const containersByPlant = groupSum(SHIPMENTS, (s) => s.plant, (s) => s.cont)
export const workOrdersByTransporter = groupSum(SHIPMENTS, (s) => s.transporter, () => 1)
export const containersByAgent = groupSum(SHIPMENTS, (s) => s.agent, (s) => s.cont)
export const containersByGate = groupSum(SHIPMENTS, (s) => s.polGate, (s) => s.cont)

// ---- Timeline: containers stuffed / planned per day ------------------------

export interface DayPoint {
  date: string
  label: string
  containers: number
  vehicles: number
  planned: boolean
}

export const stuffingTimeline: DayPoint[] = (() => {
  const map = new Map<string, { containers: number; vehicles: number }>()
  for (const s of SHIPMENTS) {
    if (!s.stuffing) continue
    const cur = map.get(s.stuffing) ?? { containers: 0, vehicles: 0 }
    cur.containers += s.cont
    cur.vehicles += s.qty
    map.set(s.stuffing, cur)
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({
      date,
      label: fmtDateShort(date),
      containers: v.containers,
      vehicles: v.vehicles,
      planned: date > DATA_AS_OF,
    }))
})()

export interface WeekPoint {
  week: string
  label: string
  containers: number
  vehicles: number
  planned: boolean
}

export const stuffingByWeek: WeekPoint[] = (() => {
  const map = new Map<string, { containers: number; vehicles: number; start: string }>()
  for (const s of SHIPMENTS) {
    if (!s.stuffing) continue
    const [y, m, d] = s.stuffing.split("-").map(Number)
    const dt = new Date(Date.UTC(y, m - 1, d))
    const day = dt.getUTCDay() === 0 ? 7 : dt.getUTCDay()
    dt.setUTCDate(dt.getUTCDate() - (day - 1)) // Monday of that week
    const key = dt.toISOString().slice(0, 10)
    const cur = map.get(key) ?? { containers: 0, vehicles: 0, start: key }
    cur.containers += s.cont
    cur.vehicles += s.qty
    map.set(key, cur)
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, v]) => ({
      week,
      label: fmtDateShort(week),
      containers: v.containers,
      vehicles: v.vehicles,
      planned: week > DATA_AS_OF,
    }))
})()

// ---- Trade lanes -----------------------------------------------------------

export interface Lane {
  port: string
  countries: string[]
  coords: [number, number]
  workOrders: number
  containers: number
  vehicles: number
  sailed: number
}

export const lanes: Lane[] = (() => {
  const map = new Map<string, Lane>()
  for (const s of withStatus) {
    if (!s.port || !PORT_COORDS[s.port]) continue
    const lane =
      map.get(s.port) ??
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
    map.set(s.port, lane)
  }
  return [...map.values()].sort((a, b) => b.containers - a.containers)
})()

// ---- Vessel groupings ------------------------------------------------------

export interface VesselGroup {
  vessel: string
  line?: string
  etd?: string
  ports: string[]
  workOrders: number
  containers: number
  sailed: boolean
}

export const vesselGroups: VesselGroup[] = (() => {
  const map = new Map<string, VesselGroup>()
  for (const s of withStatus) {
    if (!s.vessel) continue
    const g =
      map.get(s.vessel) ??
      ({ vessel: s.vessel, line: s.line, etd: s.etd, ports: [], workOrders: 0, containers: 0, sailed: true } as VesselGroup)
    g.workOrders += 1
    g.containers += s.cont
    if (s.etd && (!g.etd || s.etd > g.etd)) g.etd = s.etd
    if (s.port && !g.ports.includes(s.port)) g.ports.push(s.port)
    if (s.status !== "sailed") g.sailed = false
    map.set(s.vessel, g)
  }
  return [...map.values()].sort((a, b) => (a.etd ?? "9999").localeCompare(b.etd ?? "9999"))
})()

export const upcomingDepartures = vesselGroups.filter((v) => !v.sailed && v.etd && v.etd >= DATA_AS_OF)

// ---- Upcoming stuffing plan (next 7 days from snapshot) --------------------

export const upcomingStuffing = withStatus
  .filter((s) => s.stuffing && s.stuffing > DATA_AS_OF)
  .sort((a, b) => a.stuffing!.localeCompare(b.stuffing!))
