import { createHmac, randomUUID, timingSafeEqual } from "node:crypto"
import { promises as fs } from "node:fs"
import path from "node:path"
import { cookies, headers } from "next/headers"

import { getSql, withRetry } from "./db"
import { verifyPassword } from "./password"

// ---------------------------------------------------------------------------
// Config — fallback credentials apply only when no database is configured.
// With DATABASE_URL set, users live in the app_users table (see scripts/migrate.ts).
// ---------------------------------------------------------------------------

const FALLBACK_CLIENT_USER = process.env.VIPAR_USER ?? "vipar"
const FALLBACK_CLIENT_PASS = process.env.VIPAR_PASS ?? "vipar"
const FALLBACK_UPLOADER_USER = process.env.VIPAR_UPLOADER_USER ?? "upload"
const FALLBACK_UPLOADER_PASS = process.env.VIPAR_UPLOADER_PASS ?? "upload"
const FALLBACK_ADMIN_USER = process.env.VIPAR_ADMIN_USER ?? "admin"
const FALLBACK_ADMIN_PASS = process.env.VIPAR_ADMIN_PASS ?? "123456"
const AUTH_SECRET = process.env.AUTH_SECRET ?? "vipar-links-dev-secret-change-me"
const MAX_DEVICES = Number(process.env.MAX_DEVICES ?? 3)
const SESSION_HOURS = Number(process.env.SESSION_HOURS ?? 24 * 7)

export const SESSION_COOKIE = "vipar_session"
export const DEVICE_COOKIE = "vipar_device"

const DATA_DIR = path.join(process.cwd(), "data")
const DEVICES_FILE = path.join(DATA_DIR, "devices.json")
const AUDIT_FILE = path.join(DATA_DIR, "access-log.jsonl")

export type Role = "client" | "uploader" | "admin"

// ---------------------------------------------------------------------------
// Signed session tokens (HMAC-SHA256, stateless)
// ---------------------------------------------------------------------------

export interface SessionPayload {
  u: string
  role: Role
  device: string
  exp: number
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url")
}

function sign(data: string): string {
  return createHmac("sha256", AUTH_SECRET).update(data).digest("base64url")
}

export function createSessionToken(user: string, role: Role, deviceId: string): string {
  const payload: SessionPayload = {
    u: user,
    role,
    device: deviceId,
    exp: Date.now() + SESSION_HOURS * 3600_000,
  }
  const body = b64url(JSON.stringify(payload))
  return `${body}.${sign(body)}`
}

export function verifySessionToken(token?: string | null): SessionPayload | null {
  if (!token) return null
  const dot = token.lastIndexOf(".")
  if (dot < 0) return null
  const body = token.slice(0, dot)
  const sig = token.slice(dot + 1)
  const expected = sign(body)
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as SessionPayload
    if (typeof payload.exp !== "number" || payload.exp < Date.now()) return null
    if (payload.role !== "admin" && payload.role !== "uploader" && payload.role !== "client") payload.role = "client"
    return payload
  } catch {
    return null
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  return verifySessionToken(token)
}

export async function requireAdmin(): Promise<SessionPayload | null> {
  const session = await getSession()
  return session?.role === "admin" ? session : null
}

// ---------------------------------------------------------------------------
// User verification — Neon app_users table, hardcoded fallback without DB
// ---------------------------------------------------------------------------

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a)
  const bb = Buffer.from(b)
  return ba.length === bb.length && timingSafeEqual(ba, bb)
}

export async function verifyUser(username: string, password: string): Promise<{ role: Role } | null> {
  const sql = getSql()
  if (sql) {
    try {
      const rows = (await withRetry(() => sql`
        SELECT password_hash, role FROM app_users WHERE username = ${username}
      `)) as { password_hash: string; role: Role }[]
      if (rows.length === 0) return null
      return verifyPassword(password, rows[0].password_hash) ? { role: rows[0].role } : null
    } catch (err) {
      console.error("verifyUser db error:", err)
      return null
    }
  }
  if (safeEqual(username, FALLBACK_CLIENT_USER) && safeEqual(password, FALLBACK_CLIENT_PASS)) {
    return { role: "client" }
  }
  if (safeEqual(username, FALLBACK_UPLOADER_USER) && safeEqual(password, FALLBACK_UPLOADER_PASS)) {
    return { role: "uploader" }
  }
  if (safeEqual(username, FALLBACK_ADMIN_USER) && safeEqual(password, FALLBACK_ADMIN_PASS)) {
    return { role: "admin" }
  }
  return null
}

// ---------------------------------------------------------------------------
// Request identity
// ---------------------------------------------------------------------------

export async function requestIdentity(): Promise<{ ip: string; userAgent: string }> {
  const h = await headers()
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown"
  return { ip, userAgent: h.get("user-agent") ?? "unknown" }
}

const LOCAL_IPS = new Set(["127.0.0.1", "::1", "unknown"])

export function isLocalIp(ip: string): boolean {
  return LOCAL_IPS.has(ip)
}

// ---------------------------------------------------------------------------
// IP allowlist — managed from the admin panel (allowed_ips table).
// Empty list = every IP allowed. Localhost always allowed. Applies to CLIENT
// logins only, so an admin cannot lock themselves out.
// ---------------------------------------------------------------------------

export interface AllowedIp {
  id: number
  ip: string
  label: string | null
  created_at: string
}

export async function listAllowedIps(): Promise<AllowedIp[]> {
  const sql = getSql()
  if (!sql) return []
  return (await withRetry(() => sql`SELECT id, ip, label, created_at FROM allowed_ips ORDER BY id`)) as AllowedIp[]
}

export async function ipAllowedForClient(ip: string): Promise<boolean> {
  if (isLocalIp(ip)) return true
  const rules = await listAllowedIps()
  if (rules.length === 0) return true
  return rules.some((r) => (r.ip.endsWith(".") ? ip.startsWith(r.ip) : ip === r.ip))
}

// ---------------------------------------------------------------------------
// IP access requests — a client blocked at login can ask for their network to
// be allowed; an admin approves/denies from the panel. No email is wired up,
// so the requester finds out by trying to sign in again later.
// ---------------------------------------------------------------------------

export type IpRequestStatus = "pending" | "approved" | "denied"

export interface IpRequest {
  id: number
  username: string
  ip: string
  user_agent: string | null
  note: string | null
  status: IpRequestStatus
  requested_at: string
  resolved_at: string | null
  resolved_by: string | null
}

export async function createIpRequest(
  username: string,
  ip: string,
  userAgent: string,
  note: string | null,
): Promise<void> {
  const sql = getSql()
  if (!sql) throw new Error("Database not configured")
  const existing = (await withRetry(() => sql`
    SELECT id FROM ip_requests WHERE ip = ${ip} AND status = 'pending' LIMIT 1
  `)) as { id: number }[]
  if (existing.length > 0) return // already pending — don't pile up duplicates
  await withRetry(() => sql`
    INSERT INTO ip_requests (username, ip, user_agent, note, status)
    VALUES (${username}, ${ip}, ${userAgent}, ${note}, 'pending')
  `)
}

export async function listIpRequests(status?: IpRequestStatus): Promise<IpRequest[]> {
  const sql = getSql()
  if (!sql) return []
  if (status) {
    return (await withRetry(() => sql`
      SELECT id, username, ip, user_agent, note, status, requested_at, resolved_at, resolved_by
      FROM ip_requests WHERE status = ${status} ORDER BY requested_at DESC
    `)) as IpRequest[]
  }
  return (await withRetry(() => sql`
    SELECT id, username, ip, user_agent, note, status, requested_at, resolved_at, resolved_by
    FROM ip_requests ORDER BY requested_at DESC LIMIT 50
  `)) as IpRequest[]
}

export async function resolveIpRequest(
  id: number,
  action: "approve" | "deny",
  resolvedBy: string,
): Promise<void> {
  const sql = getSql()
  if (!sql) throw new Error("Database not configured")
  const rows = (await withRetry(() => sql`
    SELECT ip, username FROM ip_requests WHERE id = ${id}
  `)) as { ip: string; username: string }[]
  if (rows.length === 0) return
  const { ip, username } = rows[0]
  if (action === "approve") {
    await withRetry(() => sql`
      INSERT INTO allowed_ips (ip, label)
      VALUES (${ip}, ${`requested by ${username}`})
      ON CONFLICT (ip) DO NOTHING
    `)
  }
  await withRetry(() => sql`
    UPDATE ip_requests
    SET status = ${action === "approve" ? "approved" : "denied"}, resolved_at = now(), resolved_by = ${resolvedBy}
    WHERE id = ${id}
  `)
}

// ---------------------------------------------------------------------------
// Device registry — trust-on-first-use allowlist, capped at MAX_DEVICES.
// Stored in the devices table when the DB is configured, else data/devices.json.
// Applies to client logins only.
// ---------------------------------------------------------------------------

export interface DeviceRecord {
  id: string
  firstSeen: string
  ip: string
  userAgent: string
}

async function readDevicesFile(): Promise<DeviceRecord[]> {
  try {
    return JSON.parse(await fs.readFile(DEVICES_FILE, "utf8")) as DeviceRecord[]
  } catch {
    return []
  }
}

export async function listDevices(): Promise<DeviceRecord[]> {
  const sql = getSql()
  if (sql) {
    const rows = (await withRetry(() => sql`
      SELECT id, first_seen, ip, user_agent FROM devices ORDER BY first_seen
    `)) as { id: string; first_seen: string; ip: string; user_agent: string }[]
    return rows.map((r) => ({ id: r.id, firstSeen: r.first_seen, ip: r.ip, userAgent: r.user_agent }))
  }
  return readDevicesFile()
}

export async function removeDevice(id: string): Promise<void> {
  const sql = getSql()
  if (sql) {
    await withRetry(() => sql`DELETE FROM devices WHERE id = ${id}`)
    return
  }
  const devices = await readDevicesFile()
  await fs.mkdir(DATA_DIR, { recursive: true })
  await fs.writeFile(DEVICES_FILE, JSON.stringify(devices.filter((d) => d.id !== id), null, 2))
}

export type DeviceCheck =
  | { ok: true; deviceId: string; isNew: boolean }
  | { ok: false; reason: "device-limit" }

export async function checkDevice(existingDeviceId?: string): Promise<DeviceCheck> {
  const devices = await listDevices()

  if (existingDeviceId && devices.some((d) => d.id === existingDeviceId)) {
    return { ok: true, deviceId: existingDeviceId, isNew: false }
  }

  if (devices.length >= MAX_DEVICES) {
    return { ok: false, reason: "device-limit" }
  }

  const { ip, userAgent } = await requestIdentity()
  const record: DeviceRecord = {
    id: randomUUID(),
    firstSeen: new Date().toISOString(),
    ip,
    userAgent,
  }

  const sql = getSql()
  if (sql) {
    await withRetry(() => sql`
      INSERT INTO devices (id, first_seen, ip, user_agent)
      VALUES (${record.id}, ${record.firstSeen}, ${record.ip}, ${record.userAgent})
    `)
  } else {
    await fs.mkdir(DATA_DIR, { recursive: true })
    await fs.writeFile(DEVICES_FILE, JSON.stringify([...devices, record], null, 2))
  }
  return { ok: true, deviceId: record.id, isNew: true }
}

// ---------------------------------------------------------------------------
// Audit log
// ---------------------------------------------------------------------------

export interface AuditRow {
  ts: string
  event: string
  username: string | null
  ip: string | null
  user_agent: string | null
  meta: Record<string, string> | null
}

export async function audit(event: string, extra: Record<string, string> = {}): Promise<void> {
  try {
    const { ip, userAgent } = await requestIdentity()
    const { user, ...meta } = extra
    const sql = getSql()
    if (sql) {
      await withRetry(() => sql`
        INSERT INTO access_log (event, username, ip, user_agent, meta)
        VALUES (${event}, ${user ?? null}, ${ip}, ${userAgent}, ${JSON.stringify(meta)}::jsonb)
      `)
      return
    }
    await fs.mkdir(DATA_DIR, { recursive: true })
    await fs.appendFile(
      AUDIT_FILE,
      JSON.stringify({ ts: new Date().toISOString(), event, ip, userAgent, ...extra }) + "\n",
    )
  } catch {
    // audit logging must never break the login flow
  }
}

export async function recentAuditRows(limit = 30): Promise<AuditRow[]> {
  const sql = getSql()
  if (sql) {
    return (await withRetry(() => sql`
      SELECT ts, event, username, ip, user_agent, meta
      FROM access_log ORDER BY id DESC LIMIT ${limit}
    `)) as AuditRow[]
  }
  try {
    const raw = await fs.readFile(AUDIT_FILE, "utf8")
    return raw
      .trim()
      .split("\n")
      .slice(-limit)
      .reverse()
      .map((line) => {
        const j = JSON.parse(line)
        return {
          ts: j.ts,
          event: j.event,
          username: j.user ?? null,
          ip: j.ip ?? null,
          user_agent: j.userAgent ?? null,
          meta: null,
        }
      })
  } catch {
    return []
  }
}

// ---------------------------------------------------------------------------
// Login rate limiting (in-memory)
// ---------------------------------------------------------------------------

const attempts = new Map<string, { count: number; resetAt: number }>()
const WINDOW_MS = 10 * 60_000
const MAX_ATTEMPTS = 5

export function rateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = attempts.get(ip)
  if (!entry || entry.resetAt < now) return false
  return entry.count >= MAX_ATTEMPTS
}

export function recordFailure(ip: string): void {
  const now = Date.now()
  const entry = attempts.get(ip)
  if (!entry || entry.resetAt < now) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS })
  } else {
    entry.count += 1
  }
}

export function clearFailures(ip: string): void {
  attempts.delete(ip)
}
