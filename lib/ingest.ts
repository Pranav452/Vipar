import * as XLSX from "xlsx"

import type { Shipment } from "./data"
import { PORT_COORDS } from "./ports"

// ---------------------------------------------------------------------------
// Parser for the LINKS operations sheet (Excel/CSV/TSV export or the Google
// Sheets download). Applies the same normalisation rules used for the
// original hand-transcribed snapshot: date cleanup, alias fixing, duplicate
// WO merging.
// ---------------------------------------------------------------------------

export interface IngestReport {
  totalRows: number
  parsedRows: number
  workOrders: number
  mergedDuplicates: number
  skippedRows: number
  vehicles: number
  containers: number
  warnings: string[]
}

export interface IngestResult {
  shipments: Shipment[]
  report: IngestReport
}

const MAX_WARNINGS = 50

const FIELD_HEADERS: Record<string, keyof RawRow> = {
  WO: "wo",
  PORT: "port",
  COUNTRY: "country",
  VEH: "model",
  QTY: "qty",
  CONT: "cont",
  "STUFFING DATE": "stuffing",
  "VSL NAME": "vessel",
  "S/LINE": "line",
  AGENT: "agent",
  TRANSPORTER: "transporter",
  PLANT: "plant",
  "PO NO": "po",
  HAZ: "haz",
  CONSIGNEE: "consignee",
  "BOOKING NO": "booking",
  "CONTAINER NO": "containers",
  "POL GATE": "polGate",
  "GATE OPEN": "gateOpen",
  "GATE CUT OFF": "gateCutoff",
  "SI CUT OFF": "siCutoff",
  "DO ETD": "doEtd",
  "CURRENT ETD": "etd",
  "FINAL VSL SOB": "sob",
  "BL NO": "blNo",
  "BL DT": "blDate",
  "SB NO": "sbNo",
  "SB DATE": "sbDate",
}

interface RawRow {
  wo?: unknown
  port?: unknown
  country?: unknown
  model?: unknown
  qty?: unknown
  cont?: unknown
  cargo?: unknown
  stuffing?: unknown
  vessel?: unknown
  line?: unknown
  agent?: unknown
  transporter?: unknown
  plant?: unknown
  po?: unknown
  haz?: unknown
  consignee?: unknown
  booking?: unknown
  containers?: unknown
  polGate?: unknown
  gateOpen?: unknown
  gateCutoff?: unknown
  siCutoff?: unknown
  doEtd?: unknown
  etd?: unknown
  sob?: unknown
  blNo?: unknown
  blDate?: unknown
  sbNo?: unknown
  sbDate?: unknown
}

const PORT_ALIASES: Record<string, string> = {
  "BEIRA PORT": "BEIRA",
  KHSIH: "SIHANOUKVILLE",
  "LEAM CHABANG": "LAEM CHABANG",
  SIHANOUKVILE: "SIHANOUKVILLE",
}

const COUNTRY_CANON: Record<string, string> = {
  DJIBOUTI: "Djibouti",
  CAMBODIA: "Cambodia",
  MYANMAR: "Myanmar",
  ZIMBABWE: "Zimbabwe",
  ANGOLA: "Angola",
  ETHIOPIA: "Ethiopia",
  THAILAND: "Thailand",
  MOROCCO: "Morocco",
  MOZAMBIQUE: "Mozambique",
  LAOS: "Laos",
}

const LINE_CANON: Record<string, string> = {
  CMA: "CMA CGM",
  "CMA CGM": "CMA CGM",
  MAERSK: "MAERSK",
  MSC: "MSC",
  ONE: "ONE",
  EVERGREEN: "EVERGREEN",
  HAPAG: "HAPAG-LLOYD",
}

const KNOWN_TRANSPORTERS = ["OMKAR", "SATISH", "JAYSHREE"]
const KNOWN_AGENTS = ["LINKS", "MGH"]
const KNOWN_CARGO = ["CKD", "SKD", "PLP", "SP", "CBU"]

function collapse(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim()
}

function normHeader(value: unknown): string {
  return collapse(value).toUpperCase()
}

function levenshtein(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
  for (let j = 0; j <= b.length; j++) dp[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      )
    }
  }
  return dp[a.length][b.length]
}

function snapToKnown(value: string, known: string[], warnings: string[], field: string): string {
  const upper = value.toUpperCase()
  if (known.includes(upper)) return upper
  for (const k of known) {
    if (levenshtein(upper, k) <= 2) {
      pushWarning(warnings, `${field}: "${value}" corrected to "${k}"`)
      return k
    }
  }
  return upper
}

function pushWarning(warnings: string[], message: string): void {
  if (warnings.length < MAX_WARNINGS) warnings.push(message)
  else if (warnings.length === MAX_WARNINGS) warnings.push("… further warnings truncated")
}

const EXCEL_EPOCH_UTC = Date.UTC(1899, 11, 30)

function isoFromParts(d: number, m: number, y: number): string | undefined {
  if (m < 1 || m > 12 || d < 1 || d > 31) return undefined
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`
}

function parseDateValue(
  value: unknown,
  ctx: string,
  fallbackYear: number,
  warnings: string[],
): string | undefined {
  if (value === null || value === undefined || value === "") return undefined

  if (value instanceof Date && !isNaN(value.getTime())) {
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`
  }

  if (typeof value === "number") {
    if (value > 20000 && value < 60000) {
      const dt = new Date(EXCEL_EPOCH_UTC + Math.round(value) * 86400_000)
      return dt.toISOString().slice(0, 10)
    }
    pushWarning(warnings, `${ctx}: unrecognised numeric date "${value}"`)
    return undefined
  }

  let str = collapse(value)
  if (!str) return undefined
  str = str.split(" ")[0] // drop any time component
  str = str.replace(/-{2,}/g, "-")

  // "19-06/2026" style: slash used as final separator
  const slashYear = str.match(/^(\d{1,2})[-.](\d{1,2})\/(\d{2,4})$/)
  if (slashYear) str = `${slashYear[1]}-${slashYear[2]}-${slashYear[3]}`

  // "23-06/24-06" style ranges: no year — take nothing, flag it
  if (/^\d{1,2}[-.]\d{1,2}(\/\d{1,2}([-.]\d{1,2})?)+$/.test(str)) {
    pushWarning(warnings, `${ctx}: ambiguous date range "${str}" ignored`)
    return undefined
  }

  const m = str.match(/^(\d{1,2})[-./](\d{1,2})[-./](\d{2,4})$/)
  if (!m) {
    pushWarning(warnings, `${ctx}: unparseable date "${str}"`)
    return undefined
  }

  let [, dStr, mStr, yStr] = m
  let year = Number(yStr)
  if (year < 100) year += 2000
  if (year < 2020 || year > 2035) {
    pushWarning(warnings, `${ctx}: suspicious year in "${str}" — corrected to ${fallbackYear}`)
    year = fallbackYear
  }

  const iso = isoFromParts(Number(dStr), Number(mStr), year)
  if (!iso) {
    pushWarning(warnings, `${ctx}: invalid date "${str}"`)
    return undefined
  }
  return iso
}

function parseIntSafe(value: unknown): number {
  if (typeof value === "number" && isFinite(value)) return Math.round(value)
  const n = parseInt(collapse(value).replace(/[^\d-]/g, ""), 10)
  return isNaN(n) ? 0 : n
}

function parseContainers(value: unknown): string[] {
  return collapse(value)
    .toUpperCase()
    .split(/\s+/)
    .filter((token) => /^[A-Z]{4}\d{6,7}$/.test(token))
}

function filledFieldCount(s: Shipment): number {
  return Object.values(s).filter((v) =>
    Array.isArray(v) ? v.length > 0 : v !== undefined && v !== "" && v !== 0,
  ).length
}

/** Unify vessel spellings that differ only by the "V-" voyage prefix. */
function canonicaliseVessels(shipments: Shipment[]): void {
  const groups = new Map<string, string[]>()
  for (const s of shipments) {
    if (!s.vessel) continue
    const key = s.vessel.replace(/\sV-?(?=\S)/, " ")
    const list = groups.get(key) ?? []
    if (!list.includes(s.vessel)) list.push(s.vessel)
    groups.set(key, list)
  }
  const canonical = new Map<string, string>()
  for (const [, variants] of groups) {
    if (variants.length < 2) continue
    const preferred = variants.find((v) => v.includes("V-")) ?? variants[0]
    for (const v of variants) canonical.set(v, preferred)
  }
  if (canonical.size === 0) return
  for (const s of shipments) {
    if (s.vessel && canonical.has(s.vessel)) s.vessel = canonical.get(s.vessel)
  }
}

export function parseWorkbook(buffer: Buffer | ArrayBuffer, fallbackYear: number): IngestResult {
  const wb = XLSX.read(buffer, { type: buffer instanceof ArrayBuffer ? "array" : "buffer" })
  const sheet = wb.Sheets[wb.SheetNames[0]]
  if (!sheet) throw new Error("Workbook has no sheets")

  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: true, defval: null })
  const warnings: string[] = []

  // Locate the header row (first row containing both WO and PORT)
  let headerRowIndex = -1
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const cells = (rows[i] ?? []).map(normHeader)
    if (cells.includes("WO") && cells.includes("PORT")) {
      headerRowIndex = i
      break
    }
  }
  if (headerRowIndex < 0) {
    throw new Error('Could not find the header row (expected columns "WO" and "Port").')
  }

  // Column mapping; the sheet has two "Type" columns — container size first,
  // cargo type (CKD/SKD/PLP/SP/CBU) second.
  const headerCells = (rows[headerRowIndex] ?? []).map(normHeader)
  const columns = new Map<number, keyof RawRow>()
  let typeSeen = 0
  headerCells.forEach((header, index) => {
    if (header === "TYPE") {
      typeSeen += 1
      if (typeSeen === 2) columns.set(index, "cargo")
      return
    }
    const field = FIELD_HEADERS[header]
    if (field) columns.set(index, field)
  })
  if (![...columns.values()].includes("cargo") && typeSeen === 1) {
    // Only one Type column present — treat it as cargo type.
    headerCells.forEach((header, index) => {
      if (header === "TYPE") columns.set(index, "cargo")
    })
  }

  const dataRows = rows.slice(headerRowIndex + 1)
  const parsed: Shipment[] = []
  let skippedRows = 0
  let tbaCounter = 0

  for (const cells of dataRows) {
    if (!cells || cells.every((c) => c === null || collapse(c) === "")) {
      skippedRows++
      continue
    }
    const raw: RawRow = {}
    columns.forEach((field, index) => {
      raw[field] = cells[index]
    })

    const wo = collapse(raw.wo)
    const port = collapse(raw.port).toUpperCase()
    const model = collapse(raw.model).toUpperCase()
    if (!wo && !port && !model) {
      skippedRows++
      continue
    }

    const rowId = wo || `TBA${tbaCounter ? `-${tbaCounter + 1}` : ""}`
    if (!wo) tbaCounter++

    const portCanon = PORT_ALIASES[port] ?? port
    if (portCanon && !PORT_COORDS[portCanon]) {
      pushWarning(warnings, `WO ${rowId}: port "${portCanon}" has no map coordinates (will not plot on globe)`)
    }

    const countryUpper = collapse(raw.country).toUpperCase()
    const country =
      COUNTRY_CANON[countryUpper] ??
      (countryUpper ? countryUpper.charAt(0) + countryUpper.slice(1).toLowerCase() : "")

    const lineUpper = collapse(raw.line).toUpperCase()
    const line = lineUpper ? (LINE_CANON[lineUpper] ?? lineUpper) : undefined

    const transporterRaw = collapse(raw.transporter)
    const agentRaw = collapse(raw.agent)
    const cargoRaw = collapse(raw.cargo).toUpperCase()
    if (cargoRaw && !KNOWN_CARGO.includes(cargoRaw)) {
      pushWarning(warnings, `WO ${rowId}: unknown cargo type "${cargoRaw}"`)
    }

    const hazRaw = collapse(raw.haz).toUpperCase()

    const date = (field: keyof RawRow, label: string) =>
      parseDateValue(raw[field], `WO ${rowId} ${label}`, fallbackYear, warnings)

    const currentEtd = date("etd", "current ETD")
    const doEtd = date("doEtd", "DO ETD")

    const shipment: Shipment = {
      wo: rowId,
      port: portCanon,
      country,
      model: model.replace(/^BOXEER\b/, "BOXER"),
      qty: parseIntSafe(raw.qty),
      cont: parseIntSafe(raw.cont),
      stuffing: date("stuffing", "stuffing date"),
      vessel: collapse(raw.vessel).toUpperCase() || undefined,
      line,
      agent: agentRaw ? snapToKnown(agentRaw, KNOWN_AGENTS, warnings, `WO ${rowId} agent`) : undefined,
      transporter: transporterRaw
        ? snapToKnown(transporterRaw, KNOWN_TRANSPORTERS, warnings, `WO ${rowId} transporter`)
        : undefined,
      cargo: (KNOWN_CARGO.includes(cargoRaw) ? cargoRaw : "CKD") as Shipment["cargo"],
      plant: collapse(raw.plant).toUpperCase() || undefined,
      po: collapse(raw.po) || undefined,
      haz: hazRaw === "YES" ? true : hazRaw === "NO" ? false : undefined,
      consignee: collapse(raw.consignee).toUpperCase() || undefined,
      booking: collapse(raw.booking) || undefined,
      containers: parseContainers(raw.containers),
      polGate: collapse(raw.polGate).toUpperCase() || undefined,
      gateOpen: date("gateOpen", "gate open"),
      gateCutoff: date("gateCutoff", "gate cut-off"),
      siCutoff: date("siCutoff", "SI cut-off"),
      etd: currentEtd ?? doEtd,
      sob: date("sob", "SOB"),
      blNo: collapse(raw.blNo) || undefined,
      blDate: date("blDate", "BL date"),
      sbNo: collapse(raw.sbNo) || undefined,
      sbDate: date("sbDate", "SB date"),
    }
    if (shipment.containers && shipment.containers.length === 0) delete shipment.containers

    parsed.push(shipment)
  }

  // Merge duplicate WO rows (sheet re-entries of the same work order):
  // the most complete row wins, gaps filled from the others.
  const byWo = new Map<string, Shipment[]>()
  for (const s of parsed) {
    const list = byWo.get(s.wo) ?? []
    list.push(s)
    byWo.set(s.wo, list)
  }

  let mergedDuplicates = 0
  const shipments: Shipment[] = []
  for (const [, group] of byWo) {
    if (group.length === 1) {
      shipments.push(group[0])
      continue
    }
    mergedDuplicates += group.length - 1
    group.sort((a, b) => filledFieldCount(b) - filledFieldCount(a))
    const base: Record<string, unknown> = { ...group[0] }
    for (const other of group.slice(1)) {
      for (const [key, value] of Object.entries(other)) {
        const empty =
          base[key] === undefined ||
          base[key] === "" ||
          (Array.isArray(base[key]) && (base[key] as unknown[]).length === 0)
        const hasValue =
          value !== undefined && value !== "" && (!Array.isArray(value) || value.length > 0)
        if (empty && hasValue) base[key] = value
      }
    }
    shipments.push(base as unknown as Shipment)
  }

  canonicaliseVessels(shipments)

  const report: IngestReport = {
    totalRows: dataRows.length,
    parsedRows: parsed.length,
    workOrders: shipments.length,
    mergedDuplicates,
    skippedRows,
    vehicles: shipments.reduce((acc, s) => acc + s.qty, 0),
    containers: shipments.reduce((acc, s) => acc + s.cont, 0),
    warnings,
  }

  return { shipments, report }
}
