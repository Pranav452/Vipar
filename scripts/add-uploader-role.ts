// Add uploader role to existing Neon database.
// Usage: npx tsx scripts/add-uploader-role.ts
// Alters app_users table constraint and seeds the uploader user.

import { neon } from "@neondatabase/serverless"
import path from "node:path"
import { readFileSync, existsSync } from "node:fs"

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

  console.log("Altering app_users table to allow 'uploader' role…")
  try {
    await sql`
      ALTER TABLE app_users DROP CONSTRAINT app_users_role_check
    `
    console.log("  dropped old constraint")
  } catch (err) {
    console.log("  (constraint already dropped or doesn't exist)")
  }

  await sql`
    ALTER TABLE app_users
    ADD CONSTRAINT app_users_role_check CHECK (role IN ('client', 'uploader', 'admin'))
  `
  console.log("  added new constraint with uploader role")

  console.log("Seeding uploader user…")
  const uploaderUser = process.env.VIPAR_UPLOADER_USER ?? "upload"
  const uploaderPass = process.env.VIPAR_UPLOADER_PASS ?? "upload"
  await sql`
    INSERT INTO app_users (username, password_hash, role)
    VALUES (${uploaderUser}, ${hashPassword(uploaderPass)}, 'uploader')
    ON CONFLICT (username) DO UPDATE SET role = 'uploader'
  `
  console.log(`  seeded: ${uploaderUser} (uploader)`)

  const users = (await sql`SELECT username, role FROM app_users ORDER BY username`) as {
    username: string
    role: string
  }[]
  console.log("\nFinal users:")
  for (const u of users) {
    console.log(`  ${u.username} → ${u.role}`)
  }
  console.log("\nDone. Roles are now:")
  console.log("  client (vipar/vipar) → dashboard only")
  console.log("  uploader (upload/upload) → dashboard + upload")
  console.log("  admin (admin/123456) → dashboard + upload + admin panel")
}

main().catch((err) => {
  console.error("Migration failed:", err)
  process.exit(1)
})
