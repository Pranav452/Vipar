import { getSession } from "@/lib/auth"
import { fetchTracking, parseBookings } from "@/lib/one-tracking"

// The proxy matcher excludes /api — this route must gate itself.
export const maxDuration = 60

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const text = await request.text()
  const bookings = parseBookings(text)
  if (bookings.length === 0) {
    return Response.json(
      { error: "No ONE booking numbers found (expected 4 letters + 8 digits, e.g. PNQG04579600)." },
      { status: 400 },
    )
  }
  if (bookings.length > 120) {
    return Response.json({ error: `Too many bookings (${bookings.length}); limit is 120 per request.` }, { status: 400 })
  }

  try {
    const result = await fetchTracking(bookings)
    return Response.json(result)
  } catch (e) {
    console.error("[tracking] fetch failed:", e)
    return Response.json({ error: e instanceof Error ? e.message : "Tracking fetch failed" }, { status: 502 })
  }
}
