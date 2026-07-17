@AGENTS.md

<!-- second-brain spoke (auto-added 2026-07-14) -->
## Project context (second brain)

Login-gated management dashboard for LINKS consignee client VIPAR — KPIs, trade-lane globe, vessel schedule, shipment tracking from ops-sheet uploads.
Stack: Next.js 16/React 19/TS, Tailwind 4 + shadcn, cobe (WebGL globe), SheetJS/xlsx, Neon Postgres (optional — degrades to hardcoded logins/JSON without DATABASE_URL).
Run: npm install && npm run dev → :3000. DB: npx tsx scripts/migrate.ts.
Watch out: .env.local (AUTH_SECRET/DATABASE_URL) — don't commit. Default logins: vipar/vipar, upload/upload, admin/123456. data/ is gitignored runtime state. lib/one-tracking.ts = live ONE-Line (Ocean Network Express) container tracking via public API — the ported ocean feature.

Cross-project brain: `C:\Users\Manilal\second-brain` — full card `notes/projects/vipar.md`, recent context `hot.md`. Read the brain for cross-project/domain knowledge; do NOT read it for general coding questions.
