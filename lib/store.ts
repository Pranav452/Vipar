import { promises as fs } from "node:fs"
import path from "node:path"

import { DATA_AS_OF, SHIPMENTS, type Shipment } from "./data"
import { getSql } from "./db"

const DATA_DIR = path.join(process.cwd(), "data")
const DATASET_FILE = path.join(DATA_DIR, "shipments.json")

export interface Dataset {
  shipments: Shipment[]
  asOf: string
  updatedAt: string | null
  source: string
  versionId: number | null
}

export interface DatasetVersion {
  id: number
  as_of: string
  source: string
  uploaded_at: string
  uploaded_by: string | null
  work_orders: number
  vehicles: number
  containers: number
  warnings: string[]
  active: boolean
}

function isoDate(value: string | Date): string {
  if (value instanceof Date) {
    // Neon returns `date` columns as JS Dates at local midnight — use local
    // components; toISOString() would shift the day back in UTC+ timezones.
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`
  }
  return String(value).slice(0, 10)
}

const BUILTIN: Dataset = {
  shipments: SHIPMENTS,
  asOf: DATA_AS_OF,
  updatedAt: null,
  source: "built-in snapshot",
  versionId: null,
}

/**
 * Live dataset. Priority: active version in Neon → data/shipments.json →
 * built-in snapshot from lib/data.ts.
 */
export async function loadDataset(): Promise<Dataset> {
  const sql = getSql()
  if (sql) {
    try {
      const rows = (await sql`
        SELECT id, as_of, source, uploaded_at, shipments
        FROM dataset_versions WHERE active = true
        ORDER BY uploaded_at DESC LIMIT 1
      `) as { id: number; as_of: string | Date; source: string; uploaded_at: string; shipments: Shipment[] }[]
      if (rows.length > 0) {
        const row = rows[0]
        return {
          shipments: row.shipments,
          asOf: isoDate(row.as_of),
          updatedAt: row.uploaded_at,
          source: row.source,
          versionId: row.id,
        }
      }
    } catch (err) {
      console.error("loadDataset db error:", err)
    }
  }

  try {
    const raw = JSON.parse(await fs.readFile(DATASET_FILE, "utf8")) as Partial<Dataset>
    if (Array.isArray(raw.shipments) && raw.shipments.length > 0 && typeof raw.asOf === "string") {
      return {
        shipments: raw.shipments as Shipment[],
        asOf: raw.asOf,
        updatedAt: raw.updatedAt ?? null,
        source: raw.source ?? "upload",
        versionId: null,
      }
    }
  } catch {
    // fall through
  }
  return BUILTIN
}

/**
 * Persist an upload. With the DB configured this appends a new version and
 * makes it active (previous versions are kept for rollback); without it,
 * data/shipments.json is overwritten.
 */
export async function saveDataset(
  shipments: Shipment[],
  asOf: string,
  source: string,
  uploadedBy: string | null,
  warnings: string[] = [],
): Promise<number | null> {
  const vehicles = shipments.reduce((acc, s) => acc + s.qty, 0)
  const containers = shipments.reduce((acc, s) => acc + s.cont, 0)

  const sql = getSql()
  if (sql) {
    const inserted = (await sql`
      INSERT INTO dataset_versions
        (as_of, source, uploaded_by, work_orders, vehicles, containers, warnings, shipments, active)
      VALUES
        (${asOf}, ${source}, ${uploadedBy}, ${shipments.length}, ${vehicles}, ${containers},
         ${JSON.stringify(warnings)}::jsonb, ${JSON.stringify(shipments)}::jsonb, false)
      RETURNING id
    `) as { id: number }[]
    const id = inserted[0].id
    await activateVersion(id)
    return id
  }

  await fs.mkdir(DATA_DIR, { recursive: true })
  await fs.writeFile(
    DATASET_FILE,
    JSON.stringify({ shipments, asOf, updatedAt: new Date().toISOString(), source }, null, 2),
  )
  return null
}

export async function listVersions(): Promise<DatasetVersion[]> {
  const sql = getSql()
  if (!sql) return []
  const rows = (await sql`
    SELECT id, as_of, source, uploaded_at, uploaded_by,
           work_orders, vehicles, containers, warnings, active
    FROM dataset_versions ORDER BY uploaded_at DESC
  `) as (Omit<DatasetVersion, "as_of" | "warnings"> & { as_of: string | Date; warnings: unknown })[]
  return rows.map((r) => ({
    ...r,
    as_of: isoDate(r.as_of),
    warnings: Array.isArray(r.warnings) ? (r.warnings as string[]) : [],
  }))
}

export async function activateVersion(id: number): Promise<void> {
  const sql = getSql()
  if (!sql) throw new Error("Database not configured")
  await sql.transaction([
    sql`UPDATE dataset_versions SET active = false WHERE active = true`,
    sql`UPDATE dataset_versions SET active = true WHERE id = ${id}`,
  ])
}
