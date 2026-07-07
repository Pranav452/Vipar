// Parser regression test: feeds a deliberately messy TSV (as exported from the
// LINKS ops sheet) through parseWorkbook and asserts the cleanup rules.
import { parseWorkbook } from "../lib/ingest"

const q = (s: string) => `"${s}"`

const HEADER = [
  "WO", "Port", "Country", "Veh", "Qty", "Cont", "Type", q("STUFFING \nDATE"), "VSL NAME", "S/LINE",
  "Agent", "TRANSPORTER", "Type", "Plant", "PO NO", "LC NO", "LC DATE", "HAZ", "CONSIGNEE", "REMARK 1",
  q("D/O \n GIVEN DT"), "BOOKING NO", "CONTAINER NO", q("POL \nGATE"), "GATE OPEN", q("GATE CUT \nOFF"),
  q("SI CUT \nOFF"), "DO ETD", q("CURRENT \nETD"), q("ETA AT \nDESTINATION"), q("FINAL VSL \n SOB"),
  q("VGM \n SUBMITTED"), q("SI \n SUBMITTED"), "BL NO", "BL DT", q("BL HAND \nOVER TIME"), "FF JOB",
  "S/LINE PAYMENT STATUS", q("CLEARANCE \n POINT"), q("OPEN \n ORDER"), "BUFFER YARD", q("E DOC \n STATUS"),
  "COURIER DT", "PICK UP DT", q("CNTR \n DISPATCH"), q("CNTR REPORT \n NHAVA SHEVA"), q("CNTR GATED \n IN PORT"),
  "SB NO", "SB DATE", "FOR HBL",
]

function row(cells: Partial<Record<number, string>>): string {
  const arr = Array.from({ length: 50 }, (_, i) => cells[i] ?? "")
  return arr.join("\t")
}

const rows = [
  HEADER.join("\t"),
  // typo model BOXEER + typo transporter OMKSAR + dotted VGM dates + slash courier date
  row({ 0: "5471858", 1: "DJIBOUTI", 2: "Djibouti", 3: "BOXEER 150 AL", 4: "720", 5: "5", 6: "40HC",
    7: "20-06-2026", 8: "ZHONG GU KUN MING V-626E", 9: "MAERSK", 10: "LINKS", 11: "OMKSAR", 12: "CKD",
    13: "WA01", 14: "PI2144825260-013", 17: "NO", 18: "RK GLOBAL", 20: "18-06-2026", 21: "271741826",
    22: "MRSU5055471 MRKU3799595 HASU5156311  CAAU7030310 CAAU6555860", 23: "NSICT", 24: "20-06-2026",
    25: "22-06-2026", 26: "21-06-2026", 27: "24-06-2026", 28: "24-06-2026", 30: "25-06-2026",
    31: "21.06.2026", 32: "21.06.2026", 33: "DJI110261097", 34: "25-06-2026", 36: "301102610002512",
    42: "19-06/2026", 47: "4347273", 48: "21-06-2026" }),
  // duplicate WO — sparse first entry, vessel without V- prefix
  row({ 0: "5585148", 1: "YANGON", 2: "Myanmar", 3: "RE RE4S", 4: "100", 5: "5", 6: "40HC",
    7: "22-06-2026", 8: "CONTI CONQUEST 036E", 9: "ONE", 10: "LINKS", 11: "SATISH", 12: "PLP",
    13: "WA10", 14: "5233245", 17: "NO", 18: "VIPAR", 20: "20-06-2026", 21: "PNQG03797700",
    23: "GTI", 24: "25-06-2026", 25: "27-06-2026", 26: "26-06-2026", 27: "29-06-2026", 28: "29-06-2026" }),
  // duplicate WO — complete second entry with BL
  row({ 0: "5585148", 1: "YANGON", 2: "Myanmar", 3: "RE RE4S", 4: "100", 5: "5", 6: "40HC",
    7: "22-06-2026", 8: "CONTI CONQUEST V-036E", 9: "ONE", 10: "LINKS", 11: "SATISH", 12: "PLP",
    13: "WA10", 14: "5233245", 17: "NO", 18: "VIPAR", 20: "20-06-2026", 21: "PNQG03797700",
    22: "NYKU5264350 ONEU0772021 ONEU0192580 BEAU5273134 TGBU5147073", 23: "GTI", 24: "25-06-2026",
    25: "27-06-2026", 26: "26-06-2026", 27: "29-06-2026", 28: "29-06-2026", 30: "29-06-2026",
    33: "JNP/RNG/25-26/G03990", 34: "29-06-2026", 47: "4486171", 48: "25-06-2026" }),
  // typo year 2062 in stuffing date
  row({ 0: "5585149", 1: "YANGON", 2: "Myanmar", 3: "RE RE4S", 4: "100", 5: "5", 6: "40HC",
    7: "26-06-2062", 8: "MOL CHARISMA V-237E", 9: "ONE", 10: "LINKS", 11: "OMKAR", 12: "PLP",
    13: "WA10", 14: "5233246", 17: "NO", 18: "VIPAR", 21: "PNQG04330500", 28: "02-07-2026" }),
  // blank WO -> TBA
  row({ 1: "SIHANOUKVILLE", 2: "Cambodia", 3: "MAXIMA Z LPG", 4: "60", 5: "5", 6: "40' HC",
    7: "03-07-2026", 8: "YM UNANIMITY 086E", 9: "ONE", 10: "LINKS", 11: "SATISH", 12: "PLP",
    13: "WA10", 14: "5233457", 18: "VIPAR", 21: "PNQG04622900", 28: "08-07-2026" }),
  // KHSIH port alias
  row({ 0: "5473854", 1: "KHSIH", 2: "Cambodia", 3: "BOXER 150 X", 4: "126", 5: "1", 6: "40' HC",
    7: "20-07-2026", 12: "CKD", 13: "WA01", 14: "PO01BOXER150XDBCKDJU" }),
  // CMA line alias
  row({ 0: "5473172", 1: "LUANDA", 2: "Angola", 3: "BOXER 100 AW KS", 4: "498", 5: "3", 6: "40'HC",
    7: "23-06-2026", 8: "CUSSLER V-0MTNJW1MA", 9: "CMA", 10: "MGH", 11: "OMKAR", 12: "CKD",
    13: "WA01", 14: "PI -9033", 17: "NO", 18: "VIPAR", 21: "AMC2557303",
    22: "SEKU6226806 BEAU4121923 CMAU6465416", 23: "NSICT", 28: "03-07-2026", 33: "HIMLSZ001642" }),
  // typo transporter STAISH
  row({ 0: "5470259", 1: "SIHANOUKVILLE", 2: "Cambodia", 3: "MAXIMA CARGO LPG", 4: "40", 5: "5",
    6: "40'HC", 7: "24-06-2026", 8: "CONTI CONQUEST V-036E", 9: "ONE", 10: "LINKS", 11: "STAISH",
    12: "CKD", 13: "WA10", 14: "PO011MAXCARGOLPGAPR2", 17: "NO", 18: "VIPAR", 21: "PNQG04035700",
    30: "29-06-2026", 33: "KOS110261106", 34: "29-06-2026" }),
  // quoted multiline remark cell
  row({ 0: "5471479", 1: "SIHANOUKVILLE", 2: "Cambodia", 3: "MAXIMA CARGO LPG", 4: "40", 5: "5",
    6: "40HC", 7: "29-06-2026", 8: "YM UNANIMITY 086E", 9: "ONE", 10: "LINKS", 11: "SATISH",
    12: "CKD", 13: "WA10", 14: "PO005MAXCARGOLPGMAY2", 17: "NO", 18: "VIPAR",
    19: q("PNQG04034600\nMUMG55299600"), 21: "PNQG04579600",
    22: "TCLU8940756 KKFU7888972 TRHU7397455 FDCU0574251 ONEU6993185", 28: "09-07-2026" }),
  // Leam Chabang typo + THAILAND uppercase
  row({ 0: "5327710/L3", 1: "Leam Chabang", 2: "THAILAND", 3: "SPARE PARTS", 5: "1", 6: "40' HC",
    7: "26-06-2026", 8: "BROOKLYN BRIDGE 0183E", 9: "ONE", 10: "LINKS", 11: "OMKAR", 12: "SP",
    13: "WA01", 17: "NO", 18: "VIPAR", 21: "PNQG04181900", 22: "FDCU0641940", 28: "04-07-2026" }),
  // completely empty row -> skipped
  row({}),
  // plain booked row
  row({ 0: "5585151", 1: "YANGON", 2: "Myanmar", 3: "RE RE4S", 4: "100", 5: "5", 6: "40' HC",
    7: "03-07-2026", 8: "YM UNANIMITY 086E", 9: "ONE", 10: "LINKS", 11: "OMKAR", 12: "PLP",
    13: "WA10", 14: "5233248", 17: "NO", 18: "VIPAR", 21: "PNQG04619800", 28: "08-07-2026" }),
]

const tsv = rows.join("\n")
const { shipments, report } = parseWorkbook(Buffer.from(tsv, "utf8"), 2026)

console.log("REPORT:", JSON.stringify(report, null, 2))

const byWo = new Map(shipments.map((s) => [s.wo, s]))
const assertTrue = (cond: boolean, msg: string) => {
  console.log(cond ? `PASS  ${msg}` : `FAIL  ${msg}`)
  if (!cond) process.exitCode = 1
}

assertTrue(report.workOrders === 10, `10 work orders after merge (got ${report.workOrders})`)
assertTrue(report.mergedDuplicates === 1, "1 duplicate merged")
assertTrue(byWo.get("5471858")?.model === "BOXER 150 AL", "BOXEER typo fixed")
assertTrue(byWo.get("5471858")?.transporter === "OMKAR", "OMKSAR snapped to OMKAR")
assertTrue(byWo.get("5470259")?.transporter === "SATISH", "STAISH snapped to SATISH")
assertTrue(byWo.get("5585148")?.blNo === "JNP/RNG/25-26/G03990", "merged row kept BL")
assertTrue(byWo.get("5585148")?.vessel === "CONTI CONQUEST V-036E", "vessel canonicalised to V- form")
assertTrue(byWo.get("5585149")?.stuffing === "2026-06-26", `2062 year corrected (got ${byWo.get("5585149")?.stuffing})`)
assertTrue(byWo.get("TBA") !== undefined, "blank WO became TBA")
assertTrue(byWo.get("5473854")?.port === "SIHANOUKVILLE", "KHSIH alias applied")
assertTrue(byWo.get("5473172")?.line === "CMA CGM", "CMA alias applied")
assertTrue(byWo.get("5327710/L3")?.port === "LAEM CHABANG", "Leam Chabang typo fixed")
assertTrue(byWo.get("5327710/L3")?.country === "Thailand", "THAILAND canonicalised")
assertTrue((byWo.get("5471858")?.containers ?? []).length === 5, "5 container numbers split")
assertTrue(byWo.get("5471858")?.sob === "2026-06-25", "SOB parsed")
assertTrue(byWo.get("5471858")?.etd === "2026-06-24", "current ETD parsed")

console.log("\nSample:", JSON.stringify(byWo.get("5585148"), null, 2))
