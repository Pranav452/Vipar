// Derives ONE-trackable bookings from the synced ops-sheet dataset, so the
// tracking page can offer them pre-filled instead of requiring manual paste.

import type { Shipment } from "./data"

export interface SheetBooking {
  booking: string
  wo: string
  vessel: string
  port: string
  etd: string
}

export interface TrackableBookings {
  bookings: SheetBooking[]
  /** Shipments on other carriers (MAERSK, MSC, …) — not trackable via the ONE API. */
  otherLineCount: number
}

// ONE booking/BL refs are 4 letters + 8 digits — same rule as parseBookings()
// in lib/one-tracking.ts. Anything else can't be queried against the ONE API.
const ONE_BOOKING_RE = /^[A-Z]{4}\d{8}$/

export function deriveTrackableBookings(shipments: Shipment[]): TrackableBookings {
  const seen = new Set<string>()
  const bookings: SheetBooking[] = []
  let otherLineCount = 0

  for (const s of shipments) {
    const line = (s.line ?? "").trim().toUpperCase()
    if (line && line !== "ONE") {
      otherLineCount++
      continue
    }
    if (line !== "ONE") continue

    const booking = (s.booking ?? "").trim().toUpperCase()
    if (!ONE_BOOKING_RE.test(booking) || seen.has(booking)) continue
    seen.add(booking)
    bookings.push({
      booking,
      wo: s.wo,
      vessel: s.vessel ?? "",
      port: s.port,
      etd: s.etd ?? "",
    })
  }

  return { bookings, otherLineCount }
}
