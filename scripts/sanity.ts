import { SHIPMENTS, shipmentStatus } from "../lib/data"

const totals = { wo: SHIPMENTS.length, qty: 0, cont: 0 }
const statusCounts: Record<string, number> = {}
for (const s of SHIPMENTS) {
  totals.qty += s.qty
  totals.cont += s.cont
  const st = shipmentStatus(s)
  statusCounts[st] = (statusCounts[st] ?? 0) + 1
}
console.log("totals:", JSON.stringify(totals))
console.log("status:", JSON.stringify(statusCounts))

const wos = SHIPMENTS.map((s) => s.wo)
console.log("dup WOs:", JSON.stringify(wos.filter((w, i) => wos.indexOf(w) !== i)))
console.log("vessels:", JSON.stringify([...new Set(SHIPMENTS.map((s) => s.vessel).filter(Boolean))].sort(), null, 1))

const badDates = SHIPMENTS.flatMap((s) =>
  [s.stuffing, s.etd, s.sob, s.blDate, s.sbDate, s.gateOpen, s.gateCutoff, s.siCutoff]
    .filter((d): d is string => !!d)
    .filter((d) => !/^2026-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/.test(d))
    .map((d) => `${s.wo}: ${d}`),
)
console.log("bad dates:", JSON.stringify(badDates))
