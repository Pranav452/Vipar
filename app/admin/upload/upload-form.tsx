"use client"

import { useActionState, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { ArrowRight, Bot, CheckCircle2, FileSpreadsheet, Loader2, TriangleAlert, UploadCloud } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import type { Shipment } from "@/lib/data"
import { cn } from "@/lib/utils"
import { analyzeUpload, commitUpload, type AnalyzeState, type CommitState } from "./actions"

const GRID_PAGE = 20

export function UploadForm({ today }: { today: string }) {
  const [state, analyzeAction, analyzing] = useActionState<AnalyzeState, FormData>(analyzeUpload, {})
  const [commitState, commitAction, committing] = useActionState<CommitState, FormData>(commitUpload, {})
  const [fileName, setFileName] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // editable copy of the parsed rows
  const [rows, setRows] = useState<Shipment[]>([])
  const [flaggedOnly, setFlaggedOnly] = useState(false)
  const [page, setPage] = useState(0)

  useEffect(() => {
    if (state.shipments) {
      setRows(state.shipments)
      setPage(0)
    }
  }, [state.shipments])

  const warningWos = useMemo(() => {
    const set = new Set<string>()
    for (const e of state.ai?.explanations ?? []) if (e.wo) set.add(e.wo)
    for (const w of state.report?.warnings ?? []) {
      const m = w.match(/^WO\s+([^\s:]+)/)
      if (m) set.add(m[1])
    }
    return set
  }, [state.ai, state.report])

  const visible = useMemo(() => {
    const indexed = rows.map((row, index) => ({ row, index }))
    return flaggedOnly ? indexed.filter(({ row }) => warningWos.has(row.wo)) : indexed
  }, [rows, flaggedOnly, warningWos])
  const pageCount = Math.max(1, Math.ceil(visible.length / GRID_PAGE))
  const safePage = Math.min(page, pageCount - 1)
  const pageRows = visible.slice(safePage * GRID_PAGE, (safePage + 1) * GRID_PAGE)

  const edit = (index: number, patch: Partial<Shipment>) =>
    setRows((cur) => cur.map((r, i) => (i === index ? { ...r, ...patch } : r)))

  const cellCls =
    "w-full rounded-md border border-transparent bg-transparent px-1.5 py-1 text-[11.5px] focus:border-emerald-500/50 focus:bg-background focus:outline-none"
  const thCls =
    "border-b border-foreground/10 px-1.5 py-2 text-left font-medium tracking-widest text-muted-foreground uppercase"

  if (commitState.success) {
    return (
      <Card className="gap-4 rounded-2xl border-emerald-500/20 bg-emerald-500/[0.04] p-6 shadow-none">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-sm font-medium">
            Committed — {commitState.workOrders} work orders
            {commitState.versionId ? ` · version #${commitState.versionId}` : ""}
          </span>
        </div>
        {commitState.warnings && commitState.warnings.length > 0 && (
          <ul data-lenis-prevent className="max-h-40 overflow-auto rounded-xl bg-foreground/[0.03] p-3 text-[11px] leading-relaxed text-muted-foreground">
            {commitState.warnings.map((w, i) => (
              <li key={i}>· {w}</li>
            ))}
          </ul>
        )}
        <Button asChild size="sm" className="group w-fit rounded-full px-4">
          <Link href="/dashboard">
            Open updated dashboard
            <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </Button>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Stage 1 — pick file + analyze */}
      {!state.shipments && (
        <form action={analyzeAction} className="flex flex-col gap-4">
          <label
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragging(false)
              const file = e.dataTransfer.files?.[0]
              if (file && inputRef.current) {
                const dt = new DataTransfer()
                dt.items.add(file)
                inputRef.current.files = dt.files
                setFileName(file.name)
              }
            }}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed p-10 text-center transition-all duration-300",
              dragging
                ? "border-emerald-500/60 bg-emerald-500/[0.06]"
                : "border-foreground/15 bg-foreground/[0.02] hover:border-foreground/30 hover:bg-foreground/[0.04]",
            )}
          >
            <input
              ref={inputRef}
              type="file"
              name="file"
              accept=".xlsx,.xls,.csv,.tsv,.txt"
              className="sr-only"
              onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
            />
            {fileName ? (
              <>
                <FileSpreadsheet className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-medium">{fileName}</span>
                <span className="text-xs text-muted-foreground">Click to choose a different file</span>
              </>
            ) : (
              <>
                <UploadCloud className="h-8 w-8 text-muted-foreground/60" />
                <span className="text-sm font-medium">Drop the operations sheet here</span>
                <span className="text-xs text-muted-foreground">
                  or click to browse · .xlsx, .csv or .tsv export of the LINKS ops sheet
                </span>
              </>
            )}
          </label>

          <Button type="submit" disabled={analyzing} className="h-10 rounded-xl px-6">
            {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
            {analyzing ? "Parsing & running AI review…" : "Analyse before upload"}
          </Button>

          {state.error && (
            <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs text-destructive">
              {state.error}
            </p>
          )}
        </form>
      )}

      {/* Stage 2 — review, edit, commit */}
      {state.shipments && state.report && (
        <>
          {/* Totals strip */}
          <Card className="flex-row flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl border-foreground/[0.06] bg-foreground/[0.02] p-4 text-xs font-medium shadow-none">
            <span>{state.fileName}</span>
            <span className="tabular-nums">{state.report.workOrders} work orders</span>
            <span className="tabular-nums">{state.report.vehicles.toLocaleString("en-IN")} vehicles</span>
            <span className="tabular-nums">{state.report.containers.toLocaleString("en-IN")} containers</span>
            <span
              className={cn(
                "tabular-nums",
                state.report.warnings.length > 0 && "text-amber-600 dark:text-amber-400",
              )}
            >
              {state.report.warnings.length} warnings
            </span>
            <span className="text-muted-foreground tabular-nums">
              {state.report.mergedDuplicates} duplicates merged
            </span>
          </Card>

          {/* AI review */}
          {(state.ai?.overview || (state.ai?.explanations.length ?? 0) > 0) && (
            <Card className="gap-4 rounded-2xl border-foreground/[0.06] bg-foreground/[0.02] p-5 shadow-none">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-medium tracking-widest uppercase">AI data-quality review</span>
              </div>
              <Separator className="bg-foreground/[0.06]" />
              {state.ai?.overview && (
                <p className="text-[13px] leading-relaxed text-foreground/90">{state.ai.overview}</p>
              )}
              {(state.ai?.actions.length ?? 0) > 0 && (
                <ol className="flex flex-col gap-1 text-xs leading-relaxed">
                  {state.ai!.actions.map((a, i) => (
                    <li key={i}>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">{i + 1}.</span>{" "}
                      {a}
                    </li>
                  ))}
                </ol>
              )}
              {(state.ai?.explanations.length ?? 0) > 0 && (
                <div data-lenis-prevent className="flex max-h-72 flex-col gap-2 overflow-y-auto pr-1">
                  {state.ai!.explanations.map((e, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] px-3 py-2"
                    >
                      <div className="flex items-start gap-1.5 text-[11.5px] font-medium">
                        <TriangleAlert className="mt-0.5 h-3 w-3 shrink-0 text-amber-600 dark:text-amber-400" />
                        {e.warning}
                      </div>
                      {e.cause && (
                        <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">
                          <span className="font-semibold text-foreground/80 uppercase">Why:</span> {e.cause}
                        </p>
                      )}
                      {e.fix && (
                        <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted-foreground">
                          <span className="font-semibold text-emerald-600 uppercase dark:text-emerald-400">
                            Fix:
                          </span>{" "}
                          {e.fix}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Raw warnings fallback when the AI review is unavailable */}
          {!state.ai?.overview && (state.ai?.explanations.length ?? 0) === 0 && state.report.warnings.length > 0 && (
            <Card className="gap-2 rounded-2xl border-foreground/[0.06] bg-foreground/[0.02] p-5 shadow-none">
              <div className="flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                <TriangleAlert className="h-3.5 w-3.5" />
                {state.report.warnings.length} data warnings
              </div>
              <ul data-lenis-prevent className="max-h-40 overflow-auto rounded-xl bg-foreground/[0.03] p-3 text-[11px] leading-relaxed text-muted-foreground">
                {state.report.warnings.map((w, i) => (
                  <li key={i}>· {w}</li>
                ))}
              </ul>
            </Card>
          )}

          {/* Editable grid */}
          <Card className="gap-0 rounded-2xl border-foreground/[0.06] bg-foreground/[0.02] p-5 shadow-none">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-medium tracking-widest uppercase">
                Check &amp; edit before commit
                <span className="ml-2 text-muted-foreground normal-case tabular-nums">
                  {visible.length} rows · flagged rows marked
                </span>
              </span>
              <label className="flex cursor-pointer items-center gap-2 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                <input
                  type="checkbox"
                  className="accent-emerald-600 dark:accent-emerald-400"
                  checked={flaggedOnly}
                  onChange={(e) => {
                    setFlaggedOnly(e.target.checked)
                    setPage(0)
                  }}
                />
                Flagged only
              </label>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-[11.5px]">
                <thead>
                  <tr className="text-[9px]">
                    <th className={thCls}>WO</th>
                    <th className={thCls}>Port</th>
                    <th className={thCls}>Country</th>
                    <th className={thCls}>Model</th>
                    <th className={cn(thCls, "text-right")}>Qty</th>
                    <th className={cn(thCls, "text-right")}>Cont</th>
                    <th className={thCls}>Vessel</th>
                    <th className={thCls}>Stuffing (ISO)</th>
                    <th className={thCls}>ETD (ISO)</th>
                    <th className={thCls}>Containers</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map(({ row: r, index }) => {
                    const flagged = warningWos.has(r.wo)
                    return (
                      <tr
                        key={index}
                        className={cn(
                          "border-b border-foreground/[0.06] align-top",
                          flagged && "bg-amber-500/[0.05]",
                        )}
                      >
                        <td className="w-28">
                          <div className="flex items-center gap-1">
                            {flagged && (
                              <TriangleAlert className="h-3 w-3 shrink-0 text-amber-600 dark:text-amber-400" />
                            )}
                            <input
                              className={cn(cellCls, "font-mono font-medium")}
                              value={r.wo}
                              onChange={(e) => edit(index, { wo: e.target.value })}
                            />
                          </div>
                        </td>
                        <td className="w-32">
                          <input
                            className={cellCls}
                            value={r.port}
                            onChange={(e) => edit(index, { port: e.target.value })}
                          />
                        </td>
                        <td className="w-26">
                          <input
                            className={cellCls}
                            value={r.country}
                            onChange={(e) => edit(index, { country: e.target.value })}
                          />
                        </td>
                        <td className="min-w-36">
                          <input
                            className={cellCls}
                            value={r.model}
                            onChange={(e) => edit(index, { model: e.target.value })}
                          />
                        </td>
                        <td className="w-14">
                          <input
                            className={cn(cellCls, "text-right tabular-nums")}
                            value={String(r.qty)}
                            onChange={(e) => edit(index, { qty: Number(e.target.value) || 0 })}
                          />
                        </td>
                        <td className="w-12">
                          <input
                            className={cn(cellCls, "text-right tabular-nums")}
                            value={String(r.cont)}
                            onChange={(e) => edit(index, { cont: Number(e.target.value) || 0 })}
                          />
                        </td>
                        <td className="min-w-40">
                          <input
                            className={cellCls}
                            value={r.vessel ?? ""}
                            onChange={(e) => edit(index, { vessel: e.target.value || undefined })}
                          />
                        </td>
                        <td className="w-26">
                          <input
                            className={cellCls}
                            value={r.stuffing ?? ""}
                            onChange={(e) => edit(index, { stuffing: e.target.value || undefined })}
                          />
                        </td>
                        <td className="w-26">
                          <input
                            className={cellCls}
                            value={r.etd ?? ""}
                            onChange={(e) => edit(index, { etd: e.target.value || undefined })}
                          />
                        </td>
                        <td className="min-w-56">
                          <textarea
                            rows={1}
                            className={cn(cellCls, "resize-y font-mono text-[10.5px]")}
                            value={(r.containers ?? []).join(" ")}
                            onChange={(e) =>
                              edit(index, {
                                containers: e.target.value.toUpperCase().split(/[\s,]+/).filter(Boolean),
                              })
                            }
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {pageCount > 1 && (
              <div className="mt-3 flex items-center justify-between border-t border-foreground/[0.06] pt-3">
                <span className="text-[11px] text-muted-foreground tabular-nums">
                  Rows {safePage * GRID_PAGE + 1}–{Math.min((safePage + 1) * GRID_PAGE, visible.length)} of{" "}
                  {visible.length}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 rounded-lg border-foreground/10 px-3 text-[11px]"
                    onClick={() => setPage(Math.max(0, safePage - 1))}
                    disabled={safePage === 0}
                  >
                    Prev
                  </Button>
                  <span className="text-[11px] tabular-nums">
                    {safePage + 1} / {pageCount}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 rounded-lg border-foreground/10 px-3 text-[11px]"
                    onClick={() => setPage(Math.min(pageCount - 1, safePage + 1))}
                    disabled={safePage >= pageCount - 1}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* Commit */}
          <form action={commitAction}>
            <Card className="flex-row flex-wrap items-end gap-4 rounded-2xl border-foreground/[0.06] bg-foreground/[0.02] p-5 shadow-none">
              <input type="hidden" name="rows" value={JSON.stringify(rows)} />
              <input type="hidden" name="source" value={state.fileName ?? "edited upload"} />
              <div className="flex flex-col gap-1.5">
                <label htmlFor="asOf" className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Data as of
                </label>
                <Input
                  id="asOf"
                  name="asOf"
                  type="date"
                  defaultValue={today}
                  className="h-10 rounded-xl border-foreground/10 bg-foreground/[0.03]"
                />
              </div>
              <Button type="submit" disabled={committing} className="h-10 rounded-xl px-6">
                {committing ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                {committing ? "Committing…" : `Commit ${rows.length} work orders & sync dashboard`}
              </Button>
              {commitState.error && (
                <p className="w-full rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs text-destructive">
                  {commitState.error}
                </p>
              )}
            </Card>
          </form>
        </>
      )}
    </div>
  )
}
