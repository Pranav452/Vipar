import { NextResponse, type NextRequest } from "next/server"

import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth"

// Optional static allowlist at the network edge, e.g.
// ALLOWED_IPS="103.120.45.10,196.223.11."  (trailing dot = prefix match).
// The admin-managed per-login allowlist lives in the database; this env layer
// is an extra hard gate for all protected routes. Localhost always allowed.
const ALLOWED_IPS = (process.env.ALLOWED_IPS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean)

const LOCAL_IPS = new Set(["127.0.0.1", "::1", "unknown"])

function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  )
}

function ipAllowed(ip: string): boolean {
  if (ALLOWED_IPS.length === 0) return true
  if (LOCAL_IPS.has(ip)) return true
  return ALLOWED_IPS.some((rule) => (rule.endsWith(".") ? ip.startsWith(rule) : ip === rule))
}

export default function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname
  const needsSession = path === "/dashboard" || path.startsWith("/dashboard/")
  const needsUpload = path === "/admin/upload" || path.startsWith("/admin/upload/")
  const needsAdmin = (path === "/admin" || path.startsWith("/admin/")) && !needsUpload
  const session = verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value)

  if (needsSession || needsUpload || needsAdmin) {
    if (!ipAllowed(clientIp(req))) {
      return new NextResponse("Access restricted to authorised networks.", { status: 403 })
    }
    if (!session) {
      const login = new URL("/login", req.nextUrl)
      login.searchParams.set("from", path)
      return NextResponse.redirect(login)
    }
    if (needsUpload && session.role !== "uploader" && session.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl))
    }
    if (needsAdmin && session.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl))
    }
  }

  if (path === "/login" && session) {
    const home = session.role === "admin" ? "/admin" : "/dashboard"
    return NextResponse.redirect(new URL(home, req.nextUrl))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico)$).*)"],
}
