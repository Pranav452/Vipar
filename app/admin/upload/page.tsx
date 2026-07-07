import type { Metadata } from "next"
import { Database } from "lucide-react"

import { Card } from "@/components/ui/card"
import { SiteHeader } from "@/components/site-header"
import { fmt, fmtDate } from "@/lib/stats"
import { loadDataset } from "@/lib/store"
import { UploadForm } from "./upload-form"

export const metadata: Metadata = {
  title: "Upload data · VIPAR by LINKS",
}

export const dynamic = "force-dynamic"

export default async function UploadPage() {
  const dataset = await loadDataset()
  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <div className="mb-8 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-[11px] font-medium tracking-widest text-muted-foreground/70 uppercase">
            <span>LINKS</span>
            <span className="text-muted-foreground/30">/</span>
            <span>Data management</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Update dashboard data</h1>
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
            Upload the latest export of the LINKS operations sheet (Excel, CSV or TSV). The system
            extracts every work order, cleans dates and typos, merges duplicate rows and recalculates
            all dashboard figures instantly.
          </p>
        </div>

        <Card className="mb-4 flex-row items-center gap-4 rounded-2xl border-foreground/[0.06] bg-foreground/[0.02] p-5 shadow-none">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-foreground/[0.08] bg-foreground/[0.03]">
            <Database className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">
              Current dataset · {fmt(dataset.shipments.length)} work orders · data as of {fmtDate(dataset.asOf)}
            </span>
            <span className="text-xs text-muted-foreground">
              Source: {dataset.source}
              {dataset.updatedAt ? ` · uploaded ${new Date(dataset.updatedAt).toLocaleString("en-IN")}` : ""}
            </span>
          </div>
        </Card>

        <UploadForm today={today} />
      </main>
    </div>
  )
}
