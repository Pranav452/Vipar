// Neon migration + seed for the VIPAR portal.
// Usage: npx tsx scripts/migrate.ts
// Reads DATABASE_URL from the environment or .env.local.

import { readFileSync, existsSync } from "node:fs"
import path from "node:path"
import { neon } from "@neondatabase/serverless"

import { DATA_AS_OF, SHIPMENTS, type Shipment } from "../lib/data"
import { hashPassword } from "../lib/password"

function loadEnvLocal(): void {
  const file = path.join(process.cwd(), ".env.local")
  if (!existsSync(file)) return
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
    if (!m) continue
    const [, key, rawValue] = m
    if (process.env[key] !== undefined) continue
    process.env[key] = rawValue.replace(/^["']|["']$/g, "")
  }
}

async function main() {
  loadEnvLocal()
  const url = process.env.DATABASE_URL
  if (!url) {
    console.error("DATABASE_URL not set. Add it to .env.local first.")
    process.exit(1)
  }
  const sql = neon(url)

  console.log("Creating tables…")
  await sql`
    CREATE TABLE IF NOT EXISTS app_users (
      username      text PRIMARY KEY,
      password_hash text NOT NULL,
      role          text NOT NULL CHECK (role IN ('client', 'uploader', 'admin')),
      created_at    timestamptz NOT NULL DEFAULT now()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS dataset_versions (
      id           serial PRIMARY KEY,
      as_of        date NOT NULL,
      source       text NOT NULL,
      uploaded_at  timestamptz NOT NULL DEFAULT now(),
      uploaded_by  text,
      work_orders  int NOT NULL,
      vehicles     int NOT NULL,
      containers   int NOT NULL,
      warnings     jsonb NOT NULL DEFAULT '[]',
      shipments    jsonb NOT NULL,
      active       boolean NOT NULL DEFAULT false
    )
  `
  await sql`CREATE INDEX IF NOT EXISTS dataset_versions_uploaded_at ON dataset_versions (uploaded_at DESC)`
  await sql`
    CREATE TABLE IF NOT EXISTS allowed_ips (
      id         serial PRIMARY KEY,
      ip         text NOT NULL UNIQUE,
      label      text,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS devices (
      id         uuid PRIMARY KEY,
      first_seen timestamptz NOT NULL DEFAULT now(),
      ip         text,
      user_agent text
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS ip_requests (
      id            serial PRIMARY KEY,
      username      text NOT NULL,
      ip            text NOT NULL,
      user_agent    text,
      note          text,
      status        text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
      requested_at  timestamptz NOT NULL DEFAULT now(),
      resolved_at   timestamptz,
      resolved_by   text
    )
  `
  await sql`CREATE INDEX IF NOT EXISTS ip_requests_status ON ip_requests (status, requested_at DESC)`
  await sql`
    CREATE TABLE IF NOT EXISTS access_log (
      id         serial PRIMARY KEY,
      ts         timestamptz NOT NULL DEFAULT now(),
      event      text NOT NULL,
      username   text,
      ip         text,
      user_agent text,
      meta       jsonb
    )
  `

  console.log("Seeding users…")
  const clientUser = process.env.VIPAR_USER ?? "vipar"
  const clientPass = process.env.VIPAR_PASS ?? "vipar"
  const uploaderUser = process.env.VIPAR_UPLOADER_USER ?? "upload"
  const uploaderPass = process.env.VIPAR_UPLOADER_PASS ?? "upload"
  const adminUser = process.env.VIPAR_ADMIN_USER ?? "admin"
  const adminPass = process.env.VIPAR_ADMIN_PASS ?? "123456"
  await sql`
    INSERT INTO app_users (username, password_hash, role)
    VALUES (${clientUser}, ${hashPassword(clientPass)}, 'client')
    ON CONFLICT (username) DO NOTHING
  `
  await sql`
    INSERT INTO app_users (username, password_hash, role)
    VALUES (${uploaderUser}, ${hashPassword(uploaderPass)}, 'uploader')
    ON CONFLICT (username) DO NOTHING
  `
  await sql`
    INSERT INTO app_users (username, password_hash, role)
    VALUES (${adminUser}, ${hashPassword(adminPass)}, 'admin')
    ON CONFLICT (username) DO NOTHING
  `

  const existing = (await sql`SELECT count(*)::int AS n FROM dataset_versions`) as { n: number }[]
  if (existing[0].n === 0) {
    console.log("Seeding dataset versions…")

    const insertVersion = async (
      shipments: Shipment[],
      asOf: string,
      source: string,
      active: boolean,
      uploadedBy: string | null,
    ) => {
      const vehicles = shipments.reduce((acc, s) => acc + s.qty, 0)
      const containers = shipments.reduce((acc, s) => acc + s.cont, 0)
      await sql`
        INSERT INTO dataset_versions
          (as_of, source, uploaded_by, work_orders, vehicles, containers, warnings, shipments, active)
        VALUES
          (${asOf}, ${source}, ${uploadedBy}, ${shipments.length}, ${vehicles}, ${containers},
           '[]'::jsonb, ${JSON.stringify(shipments)}::jsonb, ${active})
      `
      console.log(`  · ${source} (as of ${asOf}) — ${shipments.length} WOs${active ? " [active]" : ""}`)
    }

    // Version 1: the built-in hand-transcribed snapshot.
    // Version 2 (if present): the latest local upload from data/shipments.json.
    const uploadFile = path.join(process.cwd(), "data", "shipments.json")
    let localUpload: { shipments: Shipment[]; asOf: string; source?: string } | null = null
    if (existsSync(uploadFile)) {
      try {
        const raw = JSON.parse(readFileSync(uploadFile, "utf8"))
        if (Array.isArray(raw.shipments) && raw.shipments.length > 0) localUpload = raw
      } catch {
        // ignore broken file
      }
    }

    await insertVersion(SHIPMENTS, DATA_AS_OF, "built-in snapshot", localUpload === null, null)
    if (localUpload) {
      await insertVersion(
        localUpload.shipments,
        localUpload.asOf,
        localUpload.source ?? "local upload (migrated)",
        true,
        adminUser,
      )
    }
  } else {
    console.log(`dataset_versions already has ${existing[0].n} rows — skipping seed.`)
  }

  const users = (await sql`SELECT username, role FROM app_users ORDER BY username`) as {
    username: string
    role: string
  }[]
  const versions = (await sql`
    SELECT id, as_of, source, active, work_orders FROM dataset_versions ORDER BY id
  `) as { id: number; as_of: string; source: string; active: boolean; work_orders: number }[]

  console.log("\nUsers:", users.map((u) => `${u.username} (${u.role})`).join(", "))
  console.log("Versions:")
  for (const v of versions) {
    console.log(
      `  #${v.id} · as of ${String(v.as_of).slice(0, 10)} · ${v.source} · ${v.work_orders} WOs${v.active ? " · ACTIVE" : ""}`,
    )
  }
  console.log("\nMigration complete.")
}

main().catch((err) => {
  console.error("Migration failed:", err)
  process.exit(1)
})
