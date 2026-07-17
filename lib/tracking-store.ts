import { getSql, withRetry } from "./db"
import type { TrackingResult } from "./one-tracking"

// Published tracking runs. Staff (admin/uploader) run live ONE tracking and
// publish a snapshot; the client login sees the latest published snapshot.

export interface TrackingRun {
  id: number
  ran_at: string
  ran_by: string
  label: string | null
  bookings: string[]
  rows: TrackingResult["rows"]
  not_found: string[]
}

export async function saveTrackingRun(
  result: TrackingResult,
  ranBy: string,
  label: string | null,
): Promise<number> {
  const sql = getSql()
  if (!sql) throw new Error("Database not configured")
  const inserted = (await withRetry(() => sql`
    INSERT INTO tracking_runs (ran_by, label, bookings, rows, not_found)
    VALUES (${ranBy}, ${label}, ${JSON.stringify(result.bookings)}::jsonb,
            ${JSON.stringify(result.rows)}::jsonb, ${JSON.stringify(result.notFound)}::jsonb)
    RETURNING id
  `)) as { id: number }[]
  return inserted[0].id
}

export async function latestTrackingRun(): Promise<TrackingRun | null> {
  const sql = getSql()
  if (!sql) return null
  const rows = (await withRetry(() => sql`
    SELECT id, ran_at, ran_by, label, bookings, rows, not_found
    FROM tracking_runs ORDER BY ran_at DESC LIMIT 1
  `)) as TrackingRun[]
  return rows[0] ?? null
}

export async function listTrackingRuns(limit = 10): Promise<Omit<TrackingRun, "rows" | "bookings" | "not_found">[]> {
  const sql = getSql()
  if (!sql) return []
  return (await withRetry(() => sql`
    SELECT id, ran_at, ran_by, label
    FROM tracking_runs ORDER BY ran_at DESC LIMIT ${limit}
  `)) as TrackingRun[]
}
