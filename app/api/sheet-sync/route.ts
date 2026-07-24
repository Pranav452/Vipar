import { timingSafeEqual } from "node:crypto"

import { NextResponse } from "next/server"

import { runSheetSync } from "@/lib/sheet-sync"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function authorized(req: Request): boolean {
  const secret = process.env.SHEET_SYNC_SECRET
  if (!secret) return false
  const header = req.headers.get("authorization") ?? ""
  const token = header.startsWith("Bearer ") ? header.slice(7) : ""
  const a = Buffer.from(token)
  const b = Buffer.from(secret)
  return a.length === b.length && timingSafeEqual(a, b)
}

/** Cron endpoint: POST with `Authorization: Bearer ${SHEET_SYNC_SECRET}`. */
export async function POST(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }
  const result = await runSheetSync(null)
  return NextResponse.json(result, { status: result.ok ? 200 : 502 })
}
