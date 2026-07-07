"use client"

import { useActionState, useRef, useState } from "react"
import Link from "next/link"
import { ArrowRight, CheckCircle2, FileSpreadsheet, Loader2, TriangleAlert, UploadCloud } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { ingestUpload, type UploadState } from "./actions"

export function UploadForm({ today }: { today: string }) {
  const [state, action, pending] = useActionState<UploadState, FormData>(ingestUpload, {})
  const [fileName, setFileName] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="flex flex-col gap-4">
      <form action={action} className="flex flex-col gap-4">
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
              <FileSpreadsheet className="h-8 w-8 text-emerald-400" />
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

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex flex-1 flex-col gap-1.5">
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
          <Button type="submit" disabled={pending} className="h-10 rounded-xl px-6">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
            {pending ? "Analysing…" : "Upload & sync dashboard"}
          </Button>
        </div>
      </form>

      {state.error && (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs text-destructive">
          {state.error}
        </p>
      )}

      {state.report && (
        <Card className="gap-4 rounded-2xl border-emerald-500/20 bg-emerald-500/[0.04] p-6 shadow-none">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span className="text-sm font-medium">
              Dashboard synced from {state.fileName} · data as of {state.asOf}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Work orders", value: state.report.workOrders },
              { label: "Vehicles", value: state.report.vehicles },
              { label: "Containers", value: state.report.containers },
              { label: "Duplicates merged", value: state.report.mergedDuplicates },
            ].map((item) => (
              <div key={item.label} className="flex flex-col gap-0.5 rounded-xl bg-foreground/[0.03] p-3">
                <span className="text-lg font-semibold tabular-nums">{item.value.toLocaleString("en-IN")}</span>
                <span className="text-[10px] tracking-widest text-muted-foreground uppercase">{item.label}</span>
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">
            {state.report.parsedRows} rows parsed · {state.report.skippedRows} empty rows skipped
          </p>

          {state.report.warnings.length > 0 && (
            <>
              <Separator className="bg-foreground/[0.06]" />
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 text-xs font-medium text-amber-300/90">
                  <TriangleAlert className="h-3.5 w-3.5" />
                  {state.report.warnings.length} data warnings (cleaned automatically where possible)
                </div>
                <ul className="max-h-40 overflow-auto rounded-xl bg-foreground/[0.03] p-3 text-[11px] leading-relaxed text-muted-foreground">
                  {state.report.warnings.map((w, i) => (
                    <li key={i}>· {w}</li>
                  ))}
                </ul>
              </div>
            </>
          )}

          <Button asChild size="sm" className="group w-fit rounded-full px-4">
            <Link href="/dashboard">
              Open updated dashboard
              <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Button>
        </Card>
      )}
    </div>
  )
}
