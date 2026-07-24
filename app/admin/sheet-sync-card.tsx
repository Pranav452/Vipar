"use client"

import { useActionState } from "react"
import { RefreshCw, Sheet } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { syncFromSheet } from "./sheet-sync/actions"
import type { SheetSyncResult } from "@/lib/sheet-sync"

interface Props {
  enabled: boolean
  missingEnv: string[]
}

export function SheetSyncCard({ enabled, missingEnv }: Props) {
  const [result, formAction, pending] = useActionState<SheetSyncResult | null, FormData>(
    (prev) => syncFromSheet(prev),
    null,
  )

  return (
    <Card className="mb-4 gap-4 rounded-2xl border-foreground/[0.06] bg-foreground/[0.02] p-6 shadow-none">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground/60 [&_svg]:h-4 [&_svg]:w-4">
            <Sheet />
          </span>
          <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Google Sheet sync
          </span>
        </div>
        <span className="text-xs text-muted-foreground/50">
          {enabled ? "pulls the live ops sheet directly" : "not configured"}
        </span>
      </div>

      <p className="text-[11px] leading-relaxed text-muted-foreground/70">
        Reads the operations Google Sheet with the same parser as an Excel upload and saves it as a new
        dataset version — no file download needed. The sheet&apos;s header row must match the ops-sheet
        columns (WO, PORT, …).
      </p>

      {enabled ? (
        <div className="flex flex-col gap-3">
          <form action={formAction}>
            <Button type="submit" size="sm" disabled={pending} className="rounded-full px-4">
              <RefreshCw className={`h-3.5 w-3.5 ${pending ? "animate-spin" : ""}`} />
              {pending ? "Syncing…" : "Sync from Google Sheet"}
            </Button>
          </form>

          {result && result.ok && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-3 text-xs">
              <span className="font-medium text-emerald-600 dark:text-emerald-400">Synced.</span>{" "}
              <span className="text-muted-foreground">
                {result.workOrders} work orders · {result.containers} containers · {result.vehicles} vehicles
                {result.mergedDuplicates ? ` · ${result.mergedDuplicates} duplicate rows merged` : ""}
                {result.warningCount ? ` · ${result.warningCount} warnings` : " · no warnings"}
                {result.versionId ? ` · version #${result.versionId}` : ""}
              </span>
            </div>
          )}

          {result && !result.ok && (
            <div className="rounded-xl border border-destructive/25 bg-destructive/[0.06] px-4 py-3 text-xs text-destructive">
              {result.error}
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl bg-foreground/[0.03] px-4 py-3">
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            To enable, add to <code className="rounded bg-foreground/10 px-1">.env.local</code>:{" "}
            {missingEnv.map((name, i) => (
              <span key={name}>
                {i > 0 && ", "}
                <code className="rounded bg-foreground/10 px-1">{name}</code>
              </span>
            ))}
            . See <code className="rounded bg-foreground/10 px-1">docs/sheet-sync.md</code> for the Google
            Cloud setup steps.
          </p>
        </div>
      )}
    </Card>
  )
}
