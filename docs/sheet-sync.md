# Google Sheets sync

Pull the operations sheet directly from Google Sheets instead of downloading and uploading an
xlsx. Same parser, same normalisation, same dataset versioning — just no file in the middle.
Available on the admin panel ("Google Sheet sync" card) and as a cron-able API endpoint.

## Google Cloud setup (one time)

1. Go to [console.cloud.google.com](https://console.cloud.google.com) and create a project
   (or reuse an existing one).
2. **APIs & Services → Library** → search "Google Sheets API" → **Enable**.
3. **IAM & Admin → Service Accounts → Create service account** (name e.g. `vipar-sheet-sync`).
   No roles needed. Create.
4. Open the service account → **Keys → Add key → Create new key → JSON** → download the file.
5. From the JSON file, copy two fields into `.env.local`:
   - `client_email` → `GOOGLE_SA_EMAIL`
   - `private_key` → `GOOGLE_SA_PRIVATE_KEY` (paste it whole, in quotes — the literal `\n`
     sequences are fine, they are normalised at runtime)
6. Open the ops Google Sheet → **Share** → add the `client_email` address as **Viewer**
   (read-only is enough).
7. Copy the sheet id from the URL — the long token between `/d/` and `/edit`:
   `https://docs.google.com/spreadsheets/d/`**`<SHEET_ID>`**`/edit` → `VIPAR_SHEET_ID`.

## Environment variables

```env
GOOGLE_SA_EMAIL=vipar-sheet-sync@my-project.iam.gserviceaccount.com
GOOGLE_SA_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEv...\n-----END PRIVATE KEY-----\n"
VIPAR_SHEET_ID=1AbCdEfGh...
VIPAR_SHEET_TAB=Sheet1          # optional — omit to read the first tab
SHEET_SYNC_SECRET=some-long-random-string   # optional — only needed for the cron endpoint
```

Everything degrades gracefully: with no Google env vars set, the app builds and runs normally
and the admin card shows a setup hint with the sync button disabled.

## Sheet format

The sheet must contain the same header row as the xlsx ops sheet — a row (within the first 10)
containing at least **WO** and **PORT**, plus the usual columns (COUNTRY, VEH, QTY, CONT,
STUFFING DATE, VSL NAME, S/LINE, AGENT, TRANSPORTER, PLANT, PO NO, HAZ, CONSIGNEE, BOOKING NO,
CONTAINER NO, POL GATE, GATE OPEN, GATE CUT OFF, SI CUT OFF, DO ETD, CURRENT ETD, FINAL VSL SOB,
BL NO, BL DT, SB NO, SB DATE, and the two TYPE columns). Date cells are read as raw serial
numbers, so both real date cells and text dates like `19-06-2026` parse correctly.

## Cron / automation

`POST /api/sheet-sync` with header `Authorization: Bearer ${SHEET_SYNC_SECRET}`.
Returns the sync result as JSON (`{ ok, workOrders, containers, warningCount, ... }`);
401 if the secret is unset or wrong, 502 with `{ ok: false, error }` on sync failure.

```sh
curl -X POST https://your-host/api/sheet-sync -H "Authorization: Bearer $SHEET_SYNC_SECRET"
```
