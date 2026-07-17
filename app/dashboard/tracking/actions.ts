"use server"

import { revalidatePath } from "next/cache"

import { audit, getSession } from "@/lib/auth"
import type { TrackingResult } from "@/lib/one-tracking"
import { saveTrackingRun } from "@/lib/tracking-store"

export interface PublishState {
  error?: string
  success?: boolean
  runId?: number
}

// Staff-only: store the current live result so the client login can see it.
export async function publishTrackingRun(_prev: PublishState, formData: FormData): Promise<PublishState> {
  const session = await getSession()
  if (!session || (session.role !== "uploader" && session.role !== "admin")) {
    return { error: "Not permitted." }
  }

  let result: TrackingResult
  try {
    result = JSON.parse(String(formData.get("result") ?? "")) as TrackingResult
  } catch {
    return { error: "Could not read the tracking result — run the fetch again." }
  }
  if (!Array.isArray(result.rows) || result.rows.length === 0) {
    return { error: "Nothing to publish — fetch tracking first." }
  }

  const label = String(formData.get("label") ?? "").trim().slice(0, 80) || null

  try {
    const runId = await saveTrackingRun(result, session.u, label)
    await audit("tracking-published", {
      user: session.u,
      runId: String(runId),
      bookings: String(result.bookings.length),
      containers: String(result.rows.length - result.notFound.length),
    })
    revalidatePath("/dashboard/tracking")
    return { success: true, runId }
  } catch (err) {
    return { error: `Could not publish: ${err instanceof Error ? err.message : String(err)}` }
  }
}
