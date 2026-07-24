import { revalidatePath } from "next/cache"

import { reviewWarnings } from "./ai-review"
import { audit } from "./auth"
import { fetchSheetRows, sheetSyncEnabled } from "./google-sheets"
import { parseRows } from "./ingest"
import { saveDataset } from "./store"

export interface SheetSyncResult {
  ok: boolean
  error?: string
  workOrders?: number
  containers?: number
  vehicles?: number
  warningCount?: number
  skippedRows?: number
  mergedDuplicates?: number
  versionId?: number | null
  syncedAt?: string
}

/**
 * Pull the ops sheet straight from Google Sheets, run it through the same
 * ingest pipeline as an xlsx upload, and commit it as a new dataset version.
 * Callers (admin server action, cron API route) handle authentication.
 */
export async function runSheetSync(user: string | null): Promise<SheetSyncResult> {
  if (!sheetSyncEnabled()) {
    return { ok: false, error: "Google Sheets sync is not configured — see the setup hint below." }
  }

  try {
    const rows = await fetchSheetRows(process.env.VIPAR_SHEET_ID!, process.env.VIPAR_SHEET_TAB)
    if (rows.length === 0) {
      return { ok: false, error: "The Google Sheet returned no rows." }
    }

    const { shipments, report } = parseRows(rows, new Date().getFullYear())
    if (report.workOrders === 0) {
      return { ok: false, error: "No work orders found in the sheet — check the header row and tab." }
    }

    // Best-effort AI review of warnings (no-ops without OPENAI_API_KEY).
    let warnings = report.warnings
    try {
      const ai = await reviewWarnings(report.warnings, shipments)
      if (ai?.overview) warnings = [...report.warnings, `AI review: ${ai.overview}`]
    } catch {
      // never block the sync on the AI review
    }

    const asOf = new Date().toISOString().slice(0, 10)
    const versionId = await saveDataset(shipments, asOf, "google-sheet", user, warnings)

    await audit("dataset-sheet-sync", {
      user: user ?? "cron",
      workOrders: String(report.workOrders),
      warnings: String(warnings.length),
      ...(versionId ? { versionId: String(versionId) } : {}),
    })

    revalidatePath("/dashboard")
    revalidatePath("/admin")
    revalidatePath("/admin/upload")

    return {
      ok: true,
      workOrders: report.workOrders,
      containers: report.containers,
      vehicles: report.vehicles,
      warningCount: warnings.length,
      skippedRows: report.skippedRows,
      mergedDuplicates: report.mergedDuplicates,
      versionId,
      syncedAt: new Date().toISOString(),
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}
