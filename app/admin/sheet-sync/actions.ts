"use server"

import { getSession } from "@/lib/auth"
import { runSheetSync, type SheetSyncResult } from "@/lib/sheet-sync"

export async function syncFromSheet(_prev: SheetSyncResult | null): Promise<SheetSyncResult> {
  const session = await getSession()
  if (!session || (session.role !== "uploader" && session.role !== "admin")) {
    return { ok: false, error: "Session expired or not permitted. Sign in again." }
  }
  return runSheetSync(session.u)
}
