// ONE Line (Ocean Network Express) live cargo tracking via their public e-comm JSON API.
// No auth or anti-bot on this endpoint — plain server-side POSTs (verified 2026-07-10).

const API_URL = "https://ecomm.one-line.com/api/v2/edh/containers/track-and-trace/search"
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
const CHUNK_SIZE = 8 // bookings per API call (~5 containers each stays under page_length)
const PAGE_LENGTH = 100
const CHUNK_DELAY_MS = 150
const RETRIES = 2

export interface TrackedContainer {
  bookingNo: string
  containerNo: string
  typeSize: string
  weight: string
  latestEvent: string
  latestLocation: string
  latestTime: string
  vessel: string
  pol: string
  pod: string
  podEta: string
  podEtaFlag: "A" | "E" | ""
  currentYard: string
  status: TrackingStatus
}

export type TrackingStatus = "arrived" | "on-water" | "origin" | "not-found"

export interface TrackingResult {
  bookings: string[]
  rows: TrackedContainer[]
  notFound: string[]
}

interface OneCargoEvent {
  matrixId: string
  locationName?: string
  date?: string
  localPortDate?: string
  trigger?: string
}

interface OneContainer {
  bookingNo?: string
  containerNo?: string
  containerTypeSize?: string
  weight?: string
  latestEvent?: { eventName?: string; locationName?: string; date?: string }
  place?: { yardName?: string; locationName?: string }
  por?: { locationName?: string; countryName?: string }
  pod?: { locationName?: string; countryName?: string }
  vesselVoyage?: { vesselName?: string; voyageNo?: string }
  cargoEvents?: OneCargoEvent[]
}

// ONE booking/BL refs are 4 letters + 8 digits (e.g. PNQG04579600).
// Container numbers are 4 letters + 7 digits — deliberately not matched.
export function parseBookings(text: string): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  const re = /\b([A-Z]{4}\d{8})\b/g
  let m: RegExpExecArray | null
  const up = String(text ?? "").toUpperCase()
  while ((m = re.exec(up)) !== null) {
    if (!seen.has(m[1])) {
      seen.add(m[1])
      out.push(m[1])
    }
  }
  return out
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function apiSearch(searchText: string, page: number) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": UA,
      Origin: "https://ecomm.one-line.com",
      Referer: "https://ecomm.one-line.com/one-ecom/manage-shipment/cargo-tracking",
    },
    body: JSON.stringify({
      page,
      page_length: PAGE_LENGTH,
      filters: { search_text: searchText, search_type: "BKG_NO" },
      timestamp: Date.now(),
    }),
    signal: AbortSignal.timeout(30_000),
    cache: "no-store",
  })
  const json = (await res.json()) as { status: number; message?: string; total?: number; data?: OneContainer[] }
  if (json.status !== 200 || !Array.isArray(json.data)) {
    throw new Error(`ONE API error: status=${json.status} message=${json.message ?? res.status}`)
  }
  return json as { total: number; data: OneContainer[] }
}

async function apiSearchRetry(searchText: string, page: number) {
  let lastErr: unknown
  for (let i = 0; i <= RETRIES; i++) {
    try {
      return await apiSearch(searchText, page)
    } catch (e) {
      lastErr = e
      await sleep(800 * (i + 1))
    }
  }
  throw lastErr
}

// localPortDate/date are local-port wall time serialized with a Z suffix — format with UTC getters.
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
function fmtDate(iso?: string): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (isNaN(d.getTime())) return String(iso)
  const p = (n: number) => String(n).padStart(2, "0")
  return `${p(d.getUTCDate())} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`
}

// E-matrix codes observed: E061 = vessel departure POL, E089 = vessel arrival POD.
function toRow(c: OneContainer): TrackedContainer {
  const arrival = (c.cargoEvents ?? []).find((e) => e.matrixId === "E089")
  const departure = (c.cargoEvents ?? []).find((e) => e.matrixId === "E061")
  const podEtaFlag: "A" | "E" | "" = arrival ? (arrival.trigger === "ACTUAL" ? "A" : "E") : ""
  const status: TrackingStatus =
    podEtaFlag === "A" ? "arrived" : departure?.trigger === "ACTUAL" ? "on-water" : "origin"
  const vv = c.vesselVoyage ?? {}
  return {
    bookingNo: c.bookingNo ?? "",
    containerNo: c.containerNo ?? "",
    typeSize: c.containerTypeSize ?? "",
    weight: c.weight ?? "",
    latestEvent: c.latestEvent?.eventName ?? "",
    latestLocation: c.latestEvent?.locationName ?? "",
    latestTime: fmtDate(c.latestEvent?.date),
    vessel: [vv.vesselName, vv.voyageNo].filter(Boolean).join(" "),
    pol: c.por ? `${c.por.locationName}, ${c.por.countryName}` : "",
    pod: c.pod ? `${c.pod.locationName}, ${c.pod.countryName}` : "",
    podEta: arrival ? fmtDate(arrival.localPortDate || arrival.date) : "",
    podEtaFlag,
    currentYard: c.place?.yardName || c.place?.locationName || "",
    status,
  }
}

export async function fetchTracking(bookings: string[]): Promise<TrackingResult> {
  const chunks: string[][] = []
  for (let i = 0; i < bookings.length; i += CHUNK_SIZE) chunks.push(bookings.slice(i, i + CHUNK_SIZE))

  const containers: OneContainer[] = []
  for (const chunk of chunks) {
    const searchText = chunk.join(",")
    let page = 1
    let fetched = 0
    let total = Infinity
    while (fetched < total) {
      const json = await apiSearchRetry(searchText, page)
      total = json.total || 0
      fetched += json.data.length
      containers.push(...json.data)
      if (json.data.length === 0) break
      page++
    }
    if (chunks.length > 1) await sleep(CHUNK_DELAY_MS)
  }

  const found = new Set(containers.map((c) => c.bookingNo))
  const notFound = bookings.filter((b) => !found.has(b))
  const rows = containers.map(toRow)
  for (const b of notFound) {
    rows.push({
      bookingNo: b,
      containerNo: "",
      typeSize: "",
      weight: "",
      latestEvent: "",
      latestLocation: "",
      latestTime: "",
      vessel: "",
      pol: "",
      pod: "",
      podEta: "",
      podEtaFlag: "",
      currentYard: "",
      status: "not-found",
    })
  }
  return { bookings, rows, notFound }
}
