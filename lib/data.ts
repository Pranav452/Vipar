// VIPAR export operations dataset — sourced from the LINKS operations sheet.
// Data snapshot date: 2026-07-02. Duplicated sheet rows (updated re-entries of the
// same WO) were merged keeping the most complete record; obvious typos in dates
// and names were normalised.

export const DATA_AS_OF = "2026-07-02"

export type CargoType = "CKD" | "SKD" | "PLP" | "SP" | "CBU"

export type ShippingLine = "ONE" | "MSC" | "MAERSK" | "CMA CGM" | "EVERGREEN"

export interface Shipment {
  wo: string
  port: string
  country: string
  model: string
  qty: number
  cont: number
  stuffing?: string
  vessel?: string
  line?: ShippingLine
  agent?: string
  transporter?: string
  cargo: CargoType
  plant?: string
  po?: string
  haz?: boolean
  consignee?: string
  booking?: string
  containers?: string[]
  polGate?: string
  gateOpen?: string
  gateCutoff?: string
  siCutoff?: string
  etd?: string
  sob?: string
  blNo?: string
  blDate?: string
  sbNo?: string
  sbDate?: string
}

export type Status = "sailed" | "at-port" | "booked" | "planned"

export const STATUS_LABEL: Record<Status, string> = {
  sailed: "Sailed",
  "at-port": "At Port",
  booked: "Booked",
  planned: "Planned",
}

export function shipmentStatus(s: Shipment): Status {
  if (s.sob || s.blDate) return "sailed"
  if (s.containers && s.containers.length > 0) return "at-port"
  if (s.sbNo && !s.vessel && !s.booking) return "at-port"
  if (s.booking || s.vessel) return "booked"
  return "planned"
}

export const SHIPMENTS: Shipment[] = [
  {
    wo: "5471858", port: "DJIBOUTI", country: "Djibouti", model: "BOXER 150 AL", qty: 720, cont: 5,
    stuffing: "2026-06-20", vessel: "ZHONG GU KUN MING V-626E", line: "MAERSK", agent: "LINKS",
    transporter: "OMKAR", cargo: "CKD", plant: "WA01", po: "PI2144825260-013", haz: false,
    consignee: "RK GLOBAL", booking: "271741826",
    containers: ["MRSU5055471", "MRKU3799595", "HASU5156311", "CAAU7030310", "CAAU6555860"],
    polGate: "NSICT", gateOpen: "2026-06-20", gateCutoff: "2026-06-22", siCutoff: "2026-06-21",
    etd: "2026-06-24", sob: "2026-06-25", blNo: "DJI110261097", blDate: "2026-06-25",
    sbNo: "4347273", sbDate: "2026-06-21",
  },
  {
    wo: "5472012", port: "PORT BERBERA", country: "Djibouti", model: "BOXER 150 AL", qty: 432, cont: 3,
    stuffing: "2026-06-23", vessel: "MSC SIMONA IS627A", line: "MSC", agent: "LINKS",
    transporter: "OMKAR", cargo: "CKD", plant: "WA01", po: "PI2144825260-013", haz: false,
    consignee: "RK GLOBAL", booking: "EBKG17280116",
    containers: ["MSMU6860069", "MSBU7473970", "MSNU5620529"],
    polGate: "BMCT", gateOpen: "2026-06-23", gateCutoff: "2026-06-25", siCutoff: "2026-06-24",
    etd: "2026-07-04", sbNo: "4493162", sbDate: "2026-06-26",
  },
  {
    wo: "5471479", port: "SIHANOUKVILLE", country: "Cambodia", model: "MAXIMA CARGO LPG", qty: 40, cont: 5,
    stuffing: "2026-06-29", vessel: "YM UNANIMITY 086E", line: "ONE", agent: "LINKS",
    transporter: "SATISH", cargo: "CKD", plant: "WA10", po: "PO005MAXCARGOLPGMAY2", haz: false,
    consignee: "VIPAR", booking: "PNQG04579600",
    containers: ["TCLU8940756", "KKFU7888972", "TRHU7397455", "FDCU0574251", "ONEU6993185"],
    polGate: "GTI", gateOpen: "2026-07-04", gateCutoff: "2026-07-07", siCutoff: "2026-07-09",
    etd: "2026-07-09", sbNo: "4678373", sbDate: "2026-07-02",
  },
  {
    wo: "5584811", port: "SIHANOUKVILLE", country: "Cambodia", model: "MAXIMA Z LPG", qty: 60, cont: 5,
    stuffing: "2026-06-29", vessel: "CONTI CONQUEST V-036E", line: "ONE", agent: "MGH",
    transporter: "JAYSHREE", cargo: "PLP", plant: "WA10", po: "5233028", haz: false,
    consignee: "VIPAR", booking: "MUMG55300300", polGate: "GTI",
    gateOpen: "2026-06-23", gateCutoff: "2026-06-27", siCutoff: "2026-06-28", etd: "2026-06-29",
  },
  {
    wo: "5472547", port: "SIHANOUKVILLE", country: "Cambodia", model: "MAXIMA CARGO LPG", qty: 40, cont: 5,
    stuffing: "2026-06-21", vessel: "CONTI CONQUEST V-036E", line: "ONE", agent: "MGH",
    transporter: "SATISH", cargo: "CKD", plant: "WA10", po: "PO005MAXCARGOLPGJUN2", haz: false,
    booking: "MUMG55301400",
    containers: ["FSCU8569775", "ONEU6574790", "GLDU9943768", "ONEU1127803", "NYKU5160931"],
    polGate: "GTI", gateOpen: "2026-06-24", gateCutoff: "2026-06-28", siCutoff: "2026-06-28",
    etd: "2026-06-29", sob: "2026-06-29", blNo: "HIMLSZ001617", blDate: "2026-06-29",
    sbNo: "4487619", sbDate: "2026-06-25",
  },
  {
    wo: "5584991", port: "SIHANOUKVILLE", country: "Cambodia", model: "MAXIMA Z LPG", qty: 60, cont: 5,
    stuffing: "2026-06-29", vessel: "CONTI CONQUEST V-036E", line: "ONE", agent: "MGH",
    transporter: "JAYSHREE", cargo: "PLP", plant: "WA10", po: "5233141",
    booking: "MUMG55302500", polGate: "GTI",
    gateOpen: "2026-06-23", gateCutoff: "2026-06-27", siCutoff: "2026-06-24", etd: "2026-06-29",
  },
  {
    wo: "5584992", port: "SIHANOUKVILLE", country: "Cambodia", model: "MAXIMA Z LPG", qty: 60, cont: 5,
    stuffing: "2026-06-23", vessel: "CONTI CONQUEST V-036E", line: "ONE", agent: "LINKS",
    transporter: "OMKAR", cargo: "PLP", plant: "WA10", po: "5233142",
    booking: "PNQG04034600",
    gateOpen: "2026-06-23", gateCutoff: "2026-06-27", siCutoff: "2026-06-24", etd: "2026-06-29",
  },
  {
    wo: "5585008", port: "YANGON", country: "Myanmar", model: "RE RE4S", qty: 100, cont: 5,
    stuffing: "2026-06-17", vessel: "CONTI CONQUEST V-036E", line: "ONE", agent: "LINKS",
    transporter: "JAYSHREE", cargo: "PLP", plant: "WA10", po: "5233158", haz: false,
    consignee: "VIPAR", booking: "PNQG03792900",
    containers: ["SEGU4457993", "NYKU5166230", "NYKU4778801", "TEMU7501308", "TXGU8521451"],
    polGate: "GTI", gateOpen: "2026-06-25", gateCutoff: "2026-06-27", siCutoff: "2026-06-26",
    etd: "2026-06-29", sob: "2026-06-29", blNo: "JNP/RNG/25-26/G03975", blDate: "2026-06-29",
    sbNo: "4282865", sbDate: "2026-06-19",
  },
  {
    wo: "5585011", port: "YANGON", country: "Myanmar", model: "RE RE4S", qty: 100, cont: 5,
    stuffing: "2026-06-18", vessel: "CONTI CONQUEST V-036E", line: "ONE", agent: "LINKS",
    transporter: "SATISH", cargo: "PLP", plant: "WA10", po: "5233161", haz: false,
    consignee: "VIPAR", booking: "PNQG03793300",
    containers: ["CAIU9540974", "TCNU5473676", "FDCU0400394", "TCNU4083523", "KKFU8101588"],
    polGate: "GTI", gateOpen: "2026-06-25", gateCutoff: "2026-06-27", siCutoff: "2026-06-26",
    etd: "2026-06-29", sob: "2026-06-29", blNo: "JNP/RNG/25-26/G03977", blDate: "2026-06-29",
    sbNo: "4284526", sbDate: "2026-06-19",
  },
  {
    wo: "5585012", port: "YANGON", country: "Myanmar", model: "RE RE4S", qty: 100, cont: 5,
    stuffing: "2026-06-18", vessel: "CONTI CONQUEST V-036E", line: "ONE", agent: "LINKS",
    transporter: "OMKAR", cargo: "PLP", plant: "WA10", po: "5233162", haz: false,
    consignee: "VIPAR", booking: "PNQG03794400",
    containers: ["ONEU1266671", "ONEU5756065", "KKFU8115489", "ONEU5235730", "ONEU6032613"],
    polGate: "GTI", gateOpen: "2026-06-25", gateCutoff: "2026-06-27", siCutoff: "2026-06-26",
    etd: "2026-06-29", sob: "2026-06-29", blNo: "JNP/RNG/25-26/G03980", blDate: "2026-06-29",
    sbNo: "4319012", sbDate: "2026-06-20",
  },
  {
    wo: "5585015", port: "YANGON", country: "Myanmar", model: "RE RE4S", qty: 100, cont: 5,
    stuffing: "2026-06-19", vessel: "CONTI CONQUEST V-036E", line: "ONE", agent: "LINKS",
    transporter: "OMKAR", cargo: "PLP", plant: "WA10", po: "5233165", haz: false,
    consignee: "VIPAR", booking: "PNQG03798800",
    containers: ["NYKU4817106", "TXGU8972434", "ONEU6214161", "FFAU1826920", "NYKU4988238"],
    polGate: "GTI", gateOpen: "2026-06-25", gateCutoff: "2026-06-27", siCutoff: "2026-06-26",
    etd: "2026-06-29", sob: "2026-06-29", blNo: "JNP/RNG/25-26/G03982", blDate: "2026-06-29",
    sbNo: "4346604", sbDate: "2026-06-20",
  },
  {
    wo: "5585142", port: "YANGON", country: "Myanmar", model: "RE RE4S", qty: 100, cont: 5,
    stuffing: "2026-06-19", vessel: "CONTI CONQUEST V-036E", line: "ONE", agent: "LINKS",
    transporter: "OMKAR", cargo: "PLP", plant: "WA10", po: "5233239", haz: false,
    consignee: "VIPAR", booking: "PNQG03799900",
    containers: ["ONEU6932066", "BMOU5274639", "ONEU6519129", "GCXU5264251", "ONEU6194419"],
    polGate: "GTI", gateOpen: "2026-06-25", gateCutoff: "2026-06-27", siCutoff: "2026-06-26",
    etd: "2026-06-29", sob: "2026-06-29", blNo: "JNP/RNG/25-26/G03984", blDate: "2026-06-29",
    sbNo: "4353200", sbDate: "2026-06-22",
  },
  {
    wo: "5585143", port: "YANGON", country: "Myanmar", model: "RE RE4S", qty: 100, cont: 5,
    stuffing: "2026-06-20", vessel: "CONTI CONQUEST V-036E", line: "ONE", agent: "LINKS",
    transporter: "OMKAR", cargo: "PLP", plant: "WA10", po: "5233240", haz: false,
    consignee: "VIPAR", booking: "PNQG03800600",
    containers: ["ONEU0035636", "TGBU4662485", "TLLU5655136", "TCLU1535788", "BMOU6601741"],
    polGate: "GTI", gateOpen: "2026-06-25", gateCutoff: "2026-06-27", siCutoff: "2026-06-26",
    etd: "2026-06-29", sob: "2026-06-29", blNo: "JNP/RNG/25-26/G03986", blDate: "2026-06-29",
    sbNo: "4385255", sbDate: "2026-06-22",
  },
  {
    wo: "5585144", port: "YANGON", country: "Myanmar", model: "RE RE4S", qty: 100, cont: 5,
    stuffing: "2026-06-20", vessel: "CONTI CONQUEST V-036E", line: "ONE", agent: "LINKS",
    transporter: "OMKAR", cargo: "PLP", plant: "WA10", po: "5233241", haz: false,
    consignee: "VIPAR", booking: "PNQG03801700",
    containers: ["ONEU5237368", "ONEU0235146", "ONEU0610910", "ONEU5346008", "FDCU0538402"],
    polGate: "GTI", gateOpen: "2026-06-25", gateCutoff: "2026-06-27", siCutoff: "2026-06-26",
    etd: "2026-06-29", sob: "2026-06-29", blNo: "JNP/RNG/25-26/G03988", blDate: "2026-06-29",
    sbNo: "4486440", sbDate: "2026-06-25",
  },
  {
    wo: "5585148", port: "YANGON", country: "Myanmar", model: "RE RE4S", qty: 100, cont: 5,
    stuffing: "2026-06-22", vessel: "CONTI CONQUEST V-036E", line: "ONE", agent: "LINKS",
    transporter: "SATISH", cargo: "PLP", plant: "WA10", po: "5233245", haz: false,
    consignee: "VIPAR", booking: "PNQG03797700",
    containers: ["NYKU5264350", "ONEU0772021", "ONEU0192580", "BEAU5273134", "TGBU5147073"],
    polGate: "GTI", gateOpen: "2026-06-25", gateCutoff: "2026-06-27", siCutoff: "2026-06-26",
    etd: "2026-06-29", sob: "2026-06-29", blNo: "JNP/RNG/25-26/G03990", blDate: "2026-06-29",
    sbNo: "4486171", sbDate: "2026-06-25",
  },
  {
    wo: "5585145", port: "YANGON", country: "Myanmar", model: "RE RE4S", qty: 100, cont: 5,
    stuffing: "2026-06-23", vessel: "MOL CHARISMA V-237E", line: "ONE", agent: "LINKS",
    transporter: "JAYSHREE", cargo: "PLP", plant: "WA10", po: "5233242", haz: false,
    consignee: "VIPAR", booking: "PNQG04230400",
    containers: ["TRHU4266195", "ONEU6486874", "TRHU6483749", "KKFU7958112", "TCLU9568406"],
    polGate: "GTI", gateOpen: "2026-06-27", gateCutoff: "2026-06-30", siCutoff: "2026-06-30",
    etd: "2026-07-02", sob: "2026-07-02", blNo: "JNP/RNG/25-26/G03994", blDate: "2026-07-02",
    sbNo: "4487396", sbDate: "2026-06-25",
  },
  {
    wo: "5585146", port: "YANGON", country: "Myanmar", model: "RE RE4S", qty: 100, cont: 5,
    stuffing: "2026-06-23", vessel: "MOL CHARISMA V-237E", line: "ONE", agent: "LINKS",
    transporter: "JAYSHREE", cargo: "PLP", plant: "WA10", po: "5233243", haz: false,
    consignee: "VIPAR", booking: "PNQG04229500",
    containers: ["TCNU4924179", "NYKU0801708", "ONEU0214610", "TCKU7936517", "NYKU4987838"],
    polGate: "GTI", gateOpen: "2026-06-27", gateCutoff: "2026-06-30", siCutoff: "2026-06-30",
    etd: "2026-07-02", sob: "2026-07-02", blNo: "JNP/RNG/25-26/03992", blDate: "2026-07-02",
    sbNo: "4494915", sbDate: "2026-06-26",
  },
  {
    wo: "5585147", port: "YANGON", country: "Myanmar", model: "RE RE4S", qty: 100, cont: 5,
    stuffing: "2026-06-24", vessel: "MOL CHARISMA V-237E", line: "ONE", agent: "LINKS",
    transporter: "JAYSHREE", cargo: "PLP", plant: "WA10", po: "5233244", haz: false,
    consignee: "VIPAR", booking: "PNQG04228400",
    containers: ["TCNU4272722", "TRHU6423415", "TCNU4271562", "ONEU1023157", "SEGU5121560"],
    polGate: "GTI", gateOpen: "2026-06-27", gateCutoff: "2026-06-30", siCutoff: "2026-06-30",
    etd: "2026-07-02", sob: "2026-07-02", blNo: "JNP/RNG/25-26/03996", blDate: "2026-07-02",
    sbNo: "4503561", sbDate: "2026-06-26",
  },
  {
    wo: "5585155", port: "YANGON", country: "Myanmar", model: "RE RE4S", qty: 100, cont: 5,
    stuffing: "2026-06-24", vessel: "MOL CHARISMA V-237E", line: "ONE", agent: "LINKS",
    transporter: "JAYSHREE", cargo: "PLP", plant: "WA10", po: "5233252", haz: false,
    consignee: "VIPAR", booking: "PNQG04316900",
    containers: ["TGBU4503035", "FFAU6793711", "TRHU6937522", "CAIU9434400", "TCLU1539187"],
    polGate: "GTI", gateOpen: "2026-06-27", gateCutoff: "2026-06-30", siCutoff: "2026-06-30",
    etd: "2026-07-02", sob: "2026-07-02", blNo: "JNP/RNG/25-26/03998", blDate: "2026-07-02",
    sbNo: "4519443", sbDate: "2026-06-26",
  },
  {
    wo: "5585156", port: "YANGON", country: "Myanmar", model: "RE RE4S", qty: 100, cont: 5,
    stuffing: "2026-06-25", vessel: "MOL CHARISMA V-237E", line: "ONE", agent: "LINKS",
    transporter: "SATISH", cargo: "PLP", plant: "WA10", po: "5233253", haz: false,
    consignee: "VIPAR", booking: "PNQG04315800",
    containers: ["TCNU5556791", "ONEU7631909", "GCXU5425551", "FDCU0575746", "FFAU1426328"],
    polGate: "GTI", gateOpen: "2026-06-27", gateCutoff: "2026-06-30", siCutoff: "2026-06-30",
    etd: "2026-07-02", sob: "2026-07-02", blNo: "JNP/RNG/25-26/04000", blDate: "2026-07-02",
    sbNo: "4521906", sbDate: "2026-06-27",
  },
  {
    wo: "5585157", port: "YANGON", country: "Myanmar", model: "RE RE4S", qty: 100, cont: 5,
    stuffing: "2026-06-25", vessel: "MOL CHARISMA V-237E", line: "ONE", agent: "LINKS",
    transporter: "SATISH", cargo: "PLP", plant: "WA10", po: "5233254", haz: false,
    consignee: "VIPAR", booking: "PNQG04317300",
    containers: ["NYKU5221024", "NYKU4743298", "NYKU4880161", "NYKU0705941", "SEKU4417085"],
    polGate: "GTI", gateOpen: "2026-06-27", gateCutoff: "2026-06-30", siCutoff: "2026-06-30",
    etd: "2026-07-02", sob: "2026-07-02", blNo: "JNP/RNG/25-26/04002", blDate: "2026-07-02",
    sbNo: "4553193", sbDate: "2026-06-27",
  },
  {
    wo: "5585149", port: "YANGON", country: "Myanmar", model: "RE RE4S", qty: 100, cont: 5,
    stuffing: "2026-06-26", vessel: "MOL CHARISMA V-237E", line: "ONE", agent: "LINKS",
    transporter: "OMKAR", cargo: "PLP", plant: "WA10", po: "5233246", haz: false,
    consignee: "VIPAR", booking: "PNQG04330500",
    containers: ["ONEU1933732", "ONEU0724390", "ONEU1980502", "ONEU6110260", "FFAU6536919"],
    polGate: "GTI", gateOpen: "2026-06-27", gateCutoff: "2026-06-30", siCutoff: "2026-06-30",
    etd: "2026-07-02", sob: "2026-07-02", blNo: "JNP/RNG/25-26/04004", blDate: "2026-07-02",
    sbNo: "4555250", sbDate: "2026-06-28",
  },
  {
    wo: "5585150", port: "YANGON", country: "Myanmar", model: "RE RE4S", qty: 100, cont: 5,
    stuffing: "2026-06-29", vessel: "YM UNANIMITY 086E", line: "ONE", agent: "LINKS",
    transporter: "JAYSHREE", cargo: "PLP", plant: "WA10", po: "5233247", haz: false,
    consignee: "VIPAR", booking: "PNQG04331600",
    containers: ["TCLU6661897", "TCLU8788047", "TCLU9707754", "GAOU6625151", "TRHU4620776"],
    polGate: "GTI", gateOpen: "2026-06-27", gateCutoff: "2026-06-30", siCutoff: "2026-06-30",
    etd: "2026-07-02", sbNo: "4693157", sbDate: "2026-07-02",
  },
  {
    wo: "5469879", port: "YANGON", country: "Myanmar", model: "CHETAK 3503", qty: 100, cont: 2,
    stuffing: "2026-06-19", vessel: "EVER ETHIC 183E", line: "EVERGREEN", agent: "LINKS",
    transporter: "JAYSHREE", cargo: "CKD", plant: "AK01", po: "PI-3345", haz: true,
    consignee: "VIPAR", booking: "100650192131",
    containers: ["EITU9366890", "EMCU8931964"],
    polGate: "BMCT", gateOpen: "2026-06-27", gateCutoff: "2026-06-29", siCutoff: "2026-06-29",
    etd: "2026-07-03", sbNo: "4639742", sbDate: "2026-06-30",
  },
  {
    wo: "5469880", port: "YANGON", country: "Myanmar", model: "CHETAK 3503", qty: 100, cont: 2,
    stuffing: "2026-06-23", vessel: "EVER ETHIC 183E", line: "EVERGREEN", agent: "LINKS",
    transporter: "SATISH", cargo: "CKD", plant: "AK01", po: "PI-3345", haz: true,
    consignee: "VIPAR", booking: "100650192131",
    polGate: "BMCT", gateOpen: "2026-06-27", gateCutoff: "2026-06-29", siCutoff: "2026-06-29",
    etd: "2026-06-30",
  },
  {
    wo: "5473142", port: "BEIRA", country: "Zimbabwe", model: "RE RE4S", qty: 22, cont: 1,
    stuffing: "2026-06-22", vessel: "MSC DORADO VIII V-IV619R", line: "MSC", agent: "LINKS",
    transporter: "OMKAR", cargo: "SKD", plant: "WA10", po: "PO437", haz: false,
    consignee: "VIPAR", booking: "EBKG17344332", containers: ["MSDU7099908"],
    gateOpen: "2026-06-25", gateCutoff: "2026-06-28", siCutoff: "2026-06-28",
    etd: "2026-07-02", sob: "2026-07-02", blNo: "BE1110261147", blDate: "2026-07-02",
    sbNo: "4538621", sbDate: "2026-06-27",
  },
  {
    wo: "5473143", port: "BEIRA", country: "Zimbabwe", model: "RE RE4S", qty: 22, cont: 1,
    stuffing: "2026-06-22", vessel: "MSC SOFIA CELESTE V-IV628A", line: "MSC", agent: "LINKS",
    transporter: "OMKAR", cargo: "SKD", plant: "WA10", po: "PO437", haz: false,
    consignee: "VIPAR", booking: "EBKG17344329", containers: ["MSCU5166541"],
    gateOpen: "2026-06-25", gateCutoff: "2026-06-28", siCutoff: "2026-06-28",
    etd: "2026-07-10", blNo: "BE1110261148", sbNo: "4386697", sbDate: "2026-06-22",
  },
  {
    wo: "5473172", port: "LUANDA", country: "Angola", model: "BOXER 100 AW KS", qty: 498, cont: 3,
    stuffing: "2026-06-23", vessel: "CUSSLER V-0MTNJW1MA", line: "CMA CGM", agent: "MGH",
    transporter: "OMKAR", cargo: "CKD", plant: "WA01", po: "PI-9033", haz: false,
    consignee: "VIPAR", booking: "AMC2557303",
    containers: ["SEKU6226806", "BEAU4121923", "CMAU6465416"],
    polGate: "NSICT", gateOpen: "2026-06-29", gateCutoff: "2026-07-01", siCutoff: "2026-06-30",
    etd: "2026-07-03", blNo: "HIMLSZ001642", sbNo: "4462261", sbDate: "2026-06-25",
  },
  {
    wo: "5473173", port: "LUANDA", country: "Angola", model: "BOXER 100 AW KS", qty: 498, cont: 3,
    stuffing: "2026-06-24", vessel: "CUSSLER V-0MTNJW1MA", line: "CMA CGM", agent: "MGH",
    transporter: "SATISH", cargo: "CKD", plant: "WA01", po: "PI-9033", haz: false,
    consignee: "VIPAR", booking: "AMC2557303",
    containers: ["CMAU4424465", "ECMU7640809", "CMAU7381027"],
    polGate: "NSICT", gateOpen: "2026-06-29", gateCutoff: "2026-07-01", siCutoff: "2026-06-30",
    etd: "2026-07-03", blNo: "HIMLSZ001643", sbNo: "4462059", sbDate: "2026-06-25",
  },
  {
    wo: "5473174", port: "LUANDA", country: "Angola", model: "BOXER 100 AW KS", qty: 332, cont: 2,
    stuffing: "2026-06-24", vessel: "CUSSLER V-0MTNJW1MA", line: "CMA CGM", agent: "MGH",
    transporter: "SATISH", cargo: "CKD", plant: "WA01", po: "PI-9034", haz: false,
    consignee: "VIPAR", booking: "AMC2557312",
    containers: ["CMAU6680050", "ECMU9665684"],
    polGate: "NSICT", gateOpen: "2026-06-29", gateCutoff: "2026-07-01", siCutoff: "2026-06-30",
    etd: "2026-07-03", blNo: "HIMLSZ001645", sbNo: "4484533", sbDate: "2026-06-25",
  },
  {
    wo: "5473176", port: "LUANDA", country: "Angola", model: "BOXER 100 AW KS", qty: 332, cont: 2,
    stuffing: "2026-06-23", vessel: "CUSSLER V-0MTNJW1MA", line: "CMA CGM", agent: "MGH",
    transporter: "OMKAR", cargo: "CKD", plant: "WA01", po: "PI-9134", haz: false,
    consignee: "VIPAR", booking: "AMC2557312",
    containers: ["ECMU4813840", "TCNU3389606"],
    polGate: "NSICT", gateOpen: "2026-06-29", gateCutoff: "2026-07-01", siCutoff: "2026-06-30",
    etd: "2026-07-03", blNo: "HIMLSZ001646", sbNo: "4484430", sbDate: "2026-06-25",
  },
  {
    wo: "5473177", port: "LUANDA", country: "Angola", model: "BOXER 100 AW KS", qty: 332, cont: 2,
    stuffing: "2026-06-23", vessel: "CUSSLER V-0MTNJW1MA", line: "CMA CGM", agent: "MGH",
    transporter: "OMKAR", cargo: "CKD", plant: "WA01", po: "PI-9134", haz: false,
    consignee: "VIPAR", booking: "AMC2557312",
    containers: ["GAOU7034092", "CMAU7562956"],
    polGate: "NSICT", gateOpen: "2026-06-29", gateCutoff: "2026-07-01", siCutoff: "2026-06-30",
    etd: "2026-07-03", blNo: "HIMLSZ001647", sbNo: "4485566", sbDate: "2026-06-25",
  },
  {
    wo: "5327639/L2", port: "DJIBOUTI", country: "Ethiopia", model: "SPARE PARTS", qty: 0, cont: 1,
    stuffing: "2026-06-18", vessel: "ZHONG GU KUN MING V-626E", line: "MAERSK", agent: "LINKS",
    transporter: "OMKAR", cargo: "SP", plant: "WA01", haz: false,
    consignee: "VIPAR", booking: "272109094", containers: ["MRSU3625620"],
    polGate: "NSICT", gateOpen: "2026-06-20", gateCutoff: "2026-06-22", siCutoff: "2026-06-21",
    etd: "2026-06-24", sob: "2026-06-25", blDate: "2026-06-25",
    sbNo: "4316164", sbDate: "2026-06-19",
  },
  {
    wo: "5327882/L1", port: "DJIBOUTI", country: "Ethiopia", model: "SPARE PARTS", qty: 0, cont: 0,
    agent: "LINKS", cargo: "SP", plant: "WA01", haz: false,
    sbNo: "4316166", sbDate: "2026-06-19",
  },
  {
    wo: "5470259", port: "SIHANOUKVILLE", country: "Cambodia", model: "MAXIMA CARGO LPG", qty: 40, cont: 5,
    stuffing: "2026-06-24", vessel: "CONTI CONQUEST V-036E", line: "ONE", agent: "LINKS",
    transporter: "SATISH", cargo: "CKD", plant: "WA10", po: "PO011MAXCARGOLPGAPR2", haz: false,
    consignee: "VIPAR", booking: "PNQG04035700",
    containers: ["NYKU4960288", "ONEU1008471", "ONEU0671520", "ONEU5732741", "ONEU5478391"],
    polGate: "GTI", gateOpen: "2026-06-23", gateCutoff: "2026-06-27", siCutoff: "2026-06-27",
    etd: "2026-06-29", sob: "2026-06-29", blNo: "KOS110261106", blDate: "2026-06-29",
    sbNo: "4493449", sbDate: "2026-06-26",
  },
  {
    wo: "5327710/L3", port: "LAEM CHABANG", country: "Thailand", model: "SPARE PARTS", qty: 0, cont: 1,
    stuffing: "2026-06-26", vessel: "BROOKLYN BRIDGE 0183E", line: "ONE", agent: "LINKS",
    transporter: "OMKAR", cargo: "SP", plant: "WA01", haz: false,
    consignee: "VIPAR", booking: "PNQG04181900", containers: ["FDCU0641940"],
    polGate: "GTI", gateOpen: "2026-06-28", gateCutoff: "2026-07-01", siCutoff: "2026-06-30",
    etd: "2026-07-04", sbNo: "4503384", sbDate: "2026-06-26",
  },
  {
    wo: "5328086/L1", port: "LAEM CHABANG", country: "Thailand", model: "SPARE PARTS", qty: 0, cont: 0,
    cargo: "SP", consignee: "VIPAR", sbNo: "4503380", sbDate: "2026-06-26",
  },
  {
    wo: "5473336", port: "DJIBOUTI", country: "Ethiopia", model: "WEGO P5009", qty: 63, cont: 3,
    stuffing: "2026-06-26", cargo: "SKD", plant: "WA10", po: "PI-10084", consignee: "VIPAR",
  },
  {
    wo: "5585467", port: "SIHANOUKVILLE", country: "Cambodia", model: "MAXIMA Z LPG", qty: 60, cont: 5,
    stuffing: "2026-06-29", vessel: "YM UNANIMITY 086E", line: "ONE", agent: "LINKS",
    transporter: "SATISH", cargo: "PLP", plant: "WA10", po: "5233455",
    consignee: "VIPAR", booking: "PNQG04577400",
    containers: ["GCXU5203831", "DRYU9417913", "NYKU4373531", "NYKU4339413", "TCNU4891429"],
    polGate: "GTI", gateOpen: "2026-07-04", gateCutoff: "2026-07-07", siCutoff: "2026-07-07",
    etd: "2026-07-09", sbNo: "4692918", sbDate: "2026-07-02",
  },
  {
    wo: "5585468", port: "SIHANOUKVILLE", country: "Cambodia", model: "MAXIMA Z LPG", qty: 60, cont: 5,
    stuffing: "2026-06-30", vessel: "YM UNANIMITY 086E", line: "ONE", agent: "LINKS",
    transporter: "JAYSHREE", cargo: "PLP", plant: "WA10", po: "5233456",
    consignee: "VIPAR", booking: "PNQG04578500",
    polGate: "GTI", gateOpen: "2026-07-04", gateCutoff: "2026-07-07", siCutoff: "2026-07-07",
    etd: "2026-07-09",
  },
  {
    wo: "TBA", port: "SIHANOUKVILLE", country: "Cambodia", model: "MAXIMA Z LPG", qty: 60, cont: 5,
    stuffing: "2026-07-03", vessel: "YM UNANIMITY 086E", line: "ONE", agent: "LINKS",
    transporter: "SATISH", cargo: "PLP", plant: "WA10", po: "5233457",
    consignee: "VIPAR", booking: "PNQG04622900",
    polGate: "GTI", gateOpen: "2026-07-03", gateCutoff: "2026-07-06", siCutoff: "2026-07-06",
    etd: "2026-07-08",
  },
  {
    wo: "5585151", port: "YANGON", country: "Myanmar", model: "RE RE4S", qty: 100, cont: 5,
    stuffing: "2026-07-03", vessel: "YM UNANIMITY 086E", line: "ONE", agent: "LINKS",
    transporter: "OMKAR", cargo: "PLP", plant: "WA10", po: "5233248", haz: false,
    consignee: "VIPAR", booking: "PNQG04619800",
    polGate: "GTI", gateOpen: "2026-07-03", gateCutoff: "2026-07-06", siCutoff: "2026-07-06",
    etd: "2026-07-08",
  },
  {
    wo: "5585152", port: "YANGON", country: "Myanmar", model: "RE RE4S", qty: 100, cont: 5,
    stuffing: "2026-07-03", vessel: "YM UNANIMITY 086E", line: "ONE", agent: "LINKS",
    transporter: "OMKAR", cargo: "PLP", plant: "WA10", po: "5233249", haz: false,
    consignee: "VIPAR", booking: "PNQG04620700",
    polGate: "GTI", gateOpen: "2026-07-03", gateCutoff: "2026-07-06", siCutoff: "2026-07-06",
    etd: "2026-07-08",
  },
  {
    wo: "5585153", port: "YANGON", country: "Myanmar", model: "RE RE4S", qty: 100, cont: 5,
    stuffing: "2026-07-04", vessel: "YM UNANIMITY 086E", line: "ONE", agent: "LINKS",
    transporter: "JAYSHREE", cargo: "PLP", plant: "WA10", po: "5233250", haz: false,
    consignee: "VIPAR", booking: "PNQG04621800",
    polGate: "GTI", gateOpen: "2026-07-03", gateCutoff: "2026-07-06", siCutoff: "2026-07-06",
    etd: "2026-07-08",
  },
  {
    wo: "5585154", port: "YANGON", country: "Myanmar", model: "RE RE4S", qty: 100, cont: 5,
    stuffing: "2026-07-04", vessel: "YM UNANIMITY 086E", line: "ONE", agent: "LINKS",
    transporter: "JAYSHREE", cargo: "PLP", plant: "WA10", po: "5233251", haz: false,
    consignee: "VIPAR", booking: "PNQG04618700",
    polGate: "GTI", gateOpen: "2026-07-03", gateCutoff: "2026-07-06", siCutoff: "2026-07-06",
    etd: "2026-07-08",
  },
  {
    wo: "5585158", port: "YANGON", country: "Myanmar", model: "RE RE4S", qty: 100, cont: 5,
    stuffing: "2026-07-06", vessel: "YM UNANIMITY 086E", line: "ONE", agent: "LINKS",
    cargo: "PLP", plant: "WA10", po: "5233255", haz: false,
    consignee: "VIPAR", booking: "PNQG04617600",
    polGate: "GTI", gateOpen: "2026-07-03", gateCutoff: "2026-07-06", siCutoff: "2026-07-06",
    etd: "2026-07-08",
  },
  {
    wo: "5585159", port: "YANGON", country: "Myanmar", model: "RE RE4S", qty: 100, cont: 5,
    stuffing: "2026-07-07", agent: "LINKS", cargo: "PLP", plant: "WA10", po: "5233256",
    haz: false, consignee: "VIPAR",
  },
  {
    wo: "5473242", port: "LAEM CHABANG", country: "Laos", model: "RE RE4S", qty: 22, cont: 1,
    stuffing: "2026-07-08", agent: "LINKS", cargo: "SKD", plant: "WA10",
    po: "PO001RE4SSKDJUN2026", haz: false, consignee: "VIPAR",
  },
  {
    wo: "5473243", port: "LAEM CHABANG", country: "Laos", model: "RE RE4S", qty: 22, cont: 1,
    stuffing: "2026-07-08", agent: "LINKS", cargo: "SKD", plant: "WA10",
    po: "PO002RE4SSKDJUN2026", haz: false, consignee: "VIPAR",
  },
  {
    wo: "5473244", port: "LAEM CHABANG", country: "Laos", model: "RE RE4S", qty: 22, cont: 1,
    stuffing: "2026-07-08", agent: "LINKS", cargo: "SKD", plant: "WA10",
    po: "PO003RE4SSKDJUN2026", haz: false, consignee: "VIPAR",
  },
  {
    wo: "5585160", port: "YANGON", country: "Myanmar", model: "RE RE4S", qty: 100, cont: 5,
    stuffing: "2026-07-08", agent: "LINKS", cargo: "PLP", plant: "WA10", po: "5233257",
    haz: false, consignee: "VIPAR",
  },
  {
    wo: "5585161", port: "YANGON", country: "Myanmar", model: "RE RE4S", qty: 100, cont: 5,
    stuffing: "2026-07-09", agent: "LINKS", cargo: "PLP", plant: "WA10", po: "5233258",
    haz: false, consignee: "VIPAR",
  },
  {
    wo: "5585162", port: "YANGON", country: "Myanmar", model: "RE RE4S", qty: 100, cont: 5,
    stuffing: "2026-07-09", agent: "LINKS", cargo: "PLP", plant: "WA10", po: "5233259",
    haz: false, consignee: "VIPAR",
  },
  {
    wo: "5585163", port: "YANGON", country: "Myanmar", model: "RE RE4S", qty: 100, cont: 5,
    stuffing: "2026-07-10", agent: "LINKS", cargo: "PLP", plant: "WA10", po: "5233260",
    haz: false, consignee: "VIPAR",
  },
  {
    wo: "5585164", port: "YANGON", country: "Myanmar", model: "RE RE4S", qty: 100, cont: 5,
    stuffing: "2026-07-10", agent: "LINKS", cargo: "PLP", plant: "WA10", po: "5233261",
    haz: false, consignee: "VIPAR",
  },
  {
    wo: "5585165", port: "YANGON", country: "Myanmar", model: "RE RE4S", qty: 100, cont: 5,
    stuffing: "2026-07-11", agent: "LINKS", cargo: "PLP", plant: "WA10", po: "5233262",
    haz: false, consignee: "VIPAR",
  },
  {
    wo: "5585166", port: "YANGON", country: "Myanmar", model: "RE RE4S", qty: 100, cont: 5,
    stuffing: "2026-07-11", agent: "LINKS", cargo: "PLP", plant: "WA10", po: "5233263",
    haz: false, consignee: "VIPAR",
  },
  {
    wo: "5585167", port: "YANGON", country: "Myanmar", model: "RE RE4S", qty: 100, cont: 5,
    stuffing: "2026-07-13", agent: "LINKS", cargo: "PLP", plant: "WA10", po: "5233264",
    haz: false, consignee: "VIPAR",
  },
  {
    wo: "5585168", port: "YANGON", country: "Myanmar", model: "RE RE4S", qty: 100, cont: 5,
    stuffing: "2026-07-14", agent: "LINKS", cargo: "PLP", plant: "WA10", po: "5233265",
    haz: false, consignee: "VIPAR",
  },
  {
    wo: "5585169", port: "YANGON", country: "Myanmar", model: "RE RE4S", qty: 100, cont: 5,
    stuffing: "2026-07-15", agent: "LINKS", cargo: "PLP", plant: "WA10", po: "5233266",
    haz: false, consignee: "VIPAR",
  },
  {
    wo: "5585170", port: "YANGON", country: "Myanmar", model: "RE RE4S", qty: 100, cont: 5,
    stuffing: "2026-07-16", agent: "LINKS", cargo: "PLP", plant: "WA10", po: "5233267",
    haz: false, consignee: "VIPAR",
  },
  {
    wo: "5585171", port: "YANGON", country: "Myanmar", model: "RE RE4S", qty: 100, cont: 5,
    stuffing: "2026-07-16", agent: "LINKS", cargo: "PLP", plant: "WA10", po: "5233268",
    haz: false, consignee: "VIPAR",
  },
  {
    wo: "5585172", port: "YANGON", country: "Myanmar", model: "RE RE4S", qty: 100, cont: 5,
    stuffing: "2026-07-17", agent: "LINKS", cargo: "PLP", plant: "WA10", po: "5233269",
    haz: false, consignee: "VIPAR",
  },
  {
    wo: "5585173", port: "YANGON", country: "Myanmar", model: "RE RE4S", qty: 100, cont: 5,
    stuffing: "2026-07-18", agent: "LINKS", cargo: "PLP", plant: "WA10", po: "5233270",
    haz: false, consignee: "VIPAR",
  },
  {
    wo: "5585174", port: "YANGON", country: "Myanmar", model: "RE RE4S", qty: 100, cont: 5,
    stuffing: "2026-07-18", agent: "LINKS", cargo: "PLP", plant: "WA10", po: "5233271",
    haz: false, consignee: "VIPAR",
  },
  {
    wo: "5585175", port: "YANGON", country: "Myanmar", model: "RE RE4S", qty: 100, cont: 5,
    stuffing: "2026-07-20", agent: "LINKS", cargo: "PLP", plant: "WA10", po: "5233272",
    haz: false, consignee: "VIPAR",
  },
  {
    wo: "5585176", port: "YANGON", country: "Myanmar", model: "RE RE4S", qty: 100, cont: 5,
    stuffing: "2026-07-21", agent: "LINKS", cargo: "PLP", plant: "WA10", po: "5233273",
    haz: false, consignee: "VIPAR",
  },
  {
    wo: "5585177", port: "YANGON", country: "Myanmar", model: "RE RE4S", qty: 100, cont: 5,
    stuffing: "2026-07-22", agent: "LINKS", cargo: "PLP", plant: "WA10", po: "5233274",
    haz: false, consignee: "VIPAR",
  },
  {
    wo: "5585178", port: "YANGON", country: "Myanmar", model: "RE RE4S", qty: 100, cont: 5,
    stuffing: "2026-07-22", agent: "LINKS", cargo: "PLP", plant: "WA10", po: "5233275",
    haz: false, consignee: "VIPAR",
  },
  {
    wo: "5585179", port: "YANGON", country: "Myanmar", model: "RE RE4S", qty: 100, cont: 5,
    stuffing: "2026-07-23", cargo: "PLP", plant: "WA10", po: "5233276", consignee: "VIPAR",
  },
  {
    wo: "5585470", port: "SIHANOUKVILLE", country: "Cambodia", model: "MAXIMA Z LPG", qty: 60, cont: 5,
    stuffing: "2026-07-23", cargo: "PLP", plant: "WA10", po: "5233458", consignee: "VIPAR",
  },
  {
    wo: "5585180", port: "YANGON", country: "Myanmar", model: "RE RE4S", qty: 100, cont: 5,
    stuffing: "2026-07-24", cargo: "PLP", plant: "WA10", po: "5233277", haz: false, consignee: "VIPAR",
  },
  {
    wo: "5585271", port: "SIHANOUKVILLE", country: "Cambodia", model: "RE RE4S LPG", qty: 100, cont: 5,
    stuffing: "2026-07-25", cargo: "PLP", plant: "WA10", po: "5233326", haz: false, consignee: "VIPAR",
  },
  {
    wo: "5585471", port: "SIHANOUKVILLE", country: "Cambodia", model: "MAXIMA Z LPG", qty: 60, cont: 5,
    stuffing: "2026-07-25", cargo: "PLP", plant: "WA10", po: "5233459", consignee: "VIPAR",
  },
  {
    wo: "5585272", port: "SIHANOUKVILLE", country: "Cambodia", model: "RE RE4S LPG", qty: 100, cont: 5,
    stuffing: "2026-07-26", cargo: "PLP", plant: "WA10", po: "5233327", consignee: "VIPAR",
  },
  {
    wo: "5585472", port: "SIHANOUKVILLE", country: "Cambodia", model: "MAXIMA Z LPG", qty: 60, cont: 5,
    stuffing: "2026-07-27", cargo: "PLP", plant: "WA10", po: "5233460", consignee: "VIPAR",
  },
  {
    wo: "5473151", port: "CASABLANCA", country: "Morocco", model: "WA01 N 125 DISC", qty: 1, cont: 0,
    stuffing: "2026-06-29", cargo: "CBU", plant: "WA01",
  },
  {
    wo: "5473641", port: "BEIRA", country: "Mozambique", model: "BOXER 125", qty: 144, cont: 1,
    stuffing: "2026-07-06", cargo: "CKD", plant: "WA01", po: "PO451",
  },
  {
    wo: "5473642", port: "BEIRA", country: "Mozambique", model: "BOXER 125", qty: 144, cont: 1,
    stuffing: "2026-07-07", cargo: "CKD", plant: "WA01", po: "PO451",
  },
  {
    wo: "5473643", port: "BEIRA", country: "Mozambique", model: "BOXER 125", qty: 144, cont: 1,
    stuffing: "2026-07-08", cargo: "CKD", plant: "WA01", po: "PO451",
  },
  {
    wo: "5473230", port: "BEIRA", country: "Zimbabwe", model: "BOXER 150 X", qty: 126, cont: 1,
    stuffing: "2026-07-17", cargo: "CKD", plant: "WA01", po: "PIPM2132626273",
  },
  {
    wo: "5473854", port: "SIHANOUKVILLE", country: "Cambodia", model: "BOXER 150 X", qty: 126, cont: 1,
    stuffing: "2026-07-20", cargo: "CKD", plant: "WA01", po: "PO01BOXER150XDBCKDJU",
  },
  {
    wo: "5474124", port: "LUANDA", country: "Angola", model: "BOXER 100 AW KS", qty: 166, cont: 1,
    stuffing: "2026-07-21", cargo: "CKD", plant: "WA01", po: "PO448",
  },
  {
    wo: "5474125", port: "LUANDA", country: "Angola", model: "BOXER 100 AW KS", qty: 166, cont: 1,
    stuffing: "2026-07-21", cargo: "CKD", plant: "WA01", po: "PO448",
  },
  {
    wo: "5474126", port: "LUANDA", country: "Angola", model: "BOXER 100 AW KS", qty: 166, cont: 1,
    stuffing: "2026-07-22", cargo: "CKD", plant: "WA01", po: "PO448",
  },
  {
    wo: "5474127", port: "LUANDA", country: "Angola", model: "BOXER 100 AW KS", qty: 166, cont: 1,
    stuffing: "2026-07-22", cargo: "CKD", plant: "WA01", po: "PO448",
  },
  {
    wo: "5474128", port: "LUANDA", country: "Angola", model: "BOXER 100 AW KS", qty: 166, cont: 1,
    stuffing: "2026-07-23", cargo: "CKD", plant: "WA01", po: "PO448",
  },
  {
    wo: "5474129", port: "LUANDA", country: "Angola", model: "BOXER 100 AW KS", qty: 166, cont: 1,
    stuffing: "2026-07-23", cargo: "CKD", plant: "WA01", po: "PO448",
  },
  {
    wo: "5474130", port: "LUANDA", country: "Angola", model: "BOXER 100 AW KS", qty: 166, cont: 1,
    stuffing: "2026-07-24", cargo: "CKD", plant: "WA01", po: "PO448",
  },
  {
    wo: "5474131", port: "LUANDA", country: "Angola", model: "BOXER 100 AW KS", qty: 166, cont: 1,
    stuffing: "2026-07-24", cargo: "CKD", plant: "WA01", po: "PO448",
  },
  {
    wo: "5474132", port: "LUANDA", country: "Angola", model: "BOXER 100 AW KS", qty: 166, cont: 1,
    stuffing: "2026-07-24", cargo: "CKD", plant: "WA01", po: "PO448",
  },
  {
    wo: "5474133", port: "LUANDA", country: "Angola", model: "BOXER 100 AW KS", qty: 166, cont: 1,
    stuffing: "2026-07-25", cargo: "CKD", plant: "WA01", po: "PO448",
  },
  {
    wo: "5474134", port: "LUANDA", country: "Angola", model: "BOXER 100 AW KS", qty: 166, cont: 1,
    stuffing: "2026-07-25", cargo: "CKD", plant: "WA01", po: "PO448",
  },
  {
    wo: "5474135", port: "LUANDA", country: "Angola", model: "BOXER 100 AW KS", qty: 166, cont: 1,
    stuffing: "2026-07-25", cargo: "CKD", plant: "WA01", po: "PO448",
  },
  {
    wo: "5472257", port: "CASABLANCA", country: "Morocco", model: "PULSAR N 250", qty: 42, cont: 1,
    stuffing: "2026-07-04", cargo: "SKD", plant: "CH01", po: "PI-10025",
  },
  {
    wo: "5474059", port: "LUANDA", country: "Angola", model: "RE RE4S", qty: 25, cont: 1,
    stuffing: "2026-07-06", cargo: "CKD", plant: "WA10", po: "PO449",
  },
  {
    wo: "5474060", port: "LUANDA", country: "Angola", model: "RE RE4S", qty: 25, cont: 1,
    stuffing: "2026-07-06", cargo: "CKD", plant: "WA10", po: "PO449",
  },
  {
    wo: "5474061", port: "LUANDA", country: "Angola", model: "RE RE4S", qty: 25, cont: 1,
    stuffing: "2026-07-06", cargo: "CKD", plant: "WA10", po: "PO449",
  },
  {
    wo: "5474062", port: "LUANDA", country: "Angola", model: "RE RE4S", qty: 25, cont: 1,
    stuffing: "2026-07-06", cargo: "CKD", plant: "WA10", po: "PO449",
  },
  {
    wo: "5474136", port: "LUANDA", country: "Angola", model: "RE RE4S", qty: 25, cont: 1,
    stuffing: "2026-07-06", cargo: "CKD", plant: "WA10", po: "PO449",
  },
  {
    wo: "5474137", port: "LUANDA", country: "Angola", model: "RE RE4S", qty: 25, cont: 1,
    stuffing: "2026-07-06", cargo: "CKD", plant: "WA10", po: "PO449",
  },
  {
    wo: "5474138", port: "LUANDA", country: "Angola", model: "RE RE4S", qty: 25, cont: 1,
    stuffing: "2026-07-06", cargo: "CKD", plant: "WA10", po: "PO449",
  },
  {
    wo: "5474139", port: "LUANDA", country: "Angola", model: "RE RE4S", qty: 25, cont: 1,
    stuffing: "2026-07-06", cargo: "CKD", plant: "WA10", po: "PO449",
  },
  {
    wo: "5474140", port: "LUANDA", country: "Angola", model: "RE RE4S", qty: 25, cont: 1,
    stuffing: "2026-07-07", cargo: "CKD", plant: "WA10", po: "PO449",
  },
  {
    wo: "5474141", port: "LUANDA", country: "Angola", model: "RE RE4S", qty: 25, cont: 1,
    stuffing: "2026-07-07", cargo: "CKD", plant: "WA10", po: "PO449",
  },
  {
    wo: "5474142", port: "LUANDA", country: "Angola", model: "RE RE4S", qty: 25, cont: 1,
    stuffing: "2026-07-07", cargo: "CKD", plant: "WA10", po: "PO449",
  },
  {
    wo: "5474143", port: "LUANDA", country: "Angola", model: "RE RE4S", qty: 25, cont: 1,
    stuffing: "2026-07-07", cargo: "CKD", plant: "WA10", po: "PO449",
  },
  {
    wo: "5474144", port: "LUANDA", country: "Angola", model: "RE RE4S", qty: 25, cont: 1,
    stuffing: "2026-07-07", cargo: "CKD", plant: "WA10", po: "PO449",
  },
  {
    wo: "5474145", port: "LUANDA", country: "Angola", model: "RE RE4S", qty: 25, cont: 1,
    stuffing: "2026-07-07", cargo: "CKD", plant: "WA10", po: "PO449",
  },
  {
    wo: "5474146", port: "LUANDA", country: "Angola", model: "RE RE4S", qty: 25, cont: 1,
    stuffing: "2026-07-07", cargo: "CKD", plant: "WA10", po: "PO449",
  },
  {
    wo: "5474147", port: "LUANDA", country: "Angola", model: "RE RE4S", qty: 25, cont: 1,
    stuffing: "2026-07-07", cargo: "CKD", plant: "WA10", po: "PO449",
  },
  {
    wo: "5474148", port: "LUANDA", country: "Angola", model: "RE RE4S", qty: 25, cont: 1,
    stuffing: "2026-07-07", cargo: "CKD", plant: "WA10", po: "PO449",
  },
  {
    wo: "5474149", port: "LUANDA", country: "Angola", model: "RE RE4S", qty: 25, cont: 1,
    stuffing: "2026-07-07", cargo: "CKD", plant: "WA10", po: "PO449",
  },
  {
    wo: "5474150", port: "LUANDA", country: "Angola", model: "RE RE4S", qty: 25, cont: 1,
    stuffing: "2026-07-07", cargo: "CKD", plant: "WA10", po: "PO449",
  },
  {
    wo: "5474151", port: "LUANDA", country: "Angola", model: "RE RE4S", qty: 25, cont: 1,
    stuffing: "2026-07-07", cargo: "CKD", plant: "WA10", po: "PO449",
  },
  {
    wo: "5474152", port: "LUANDA", country: "Angola", model: "RE RE4S", qty: 25, cont: 1,
    stuffing: "2026-07-07", cargo: "CKD", plant: "WA10", po: "PO449",
  },
  {
    wo: "5474153", port: "LUANDA", country: "Angola", model: "RE RE4S", qty: 25, cont: 1,
    stuffing: "2026-07-07", cargo: "CKD", plant: "WA10", po: "PO449",
  },
  {
    wo: "5474154", port: "LUANDA", country: "Angola", model: "RE RE4S", qty: 25, cont: 1,
    stuffing: "2026-07-07", cargo: "CKD", plant: "WA10", po: "PO449",
  },
  {
    wo: "5474155", port: "LUANDA", country: "Angola", model: "RE RE4S", qty: 25, cont: 1,
    stuffing: "2026-07-07", cargo: "CKD", plant: "WA10", po: "PO449",
  },
  {
    wo: "5585473", port: "YANGON", country: "Myanmar", model: "RE RE4S", qty: 100, cont: 5,
    stuffing: "2026-07-24", cargo: "PLP", plant: "WA10", po: "5233461",
  },
  {
    wo: "5585474", port: "YANGON", country: "Myanmar", model: "RE RE4S", qty: 100, cont: 5,
    stuffing: "2026-07-24", cargo: "PLP", plant: "WA10", po: "5233462",
  },
  {
    wo: "5585475", port: "YANGON", country: "Myanmar", model: "RE RE4S", qty: 100, cont: 5,
    stuffing: "2026-07-25", cargo: "PLP", plant: "WA10", po: "5233463",
  },
  {
    wo: "5585476", port: "YANGON", country: "Myanmar", model: "RE RE4S", qty: 100, cont: 5,
    stuffing: "2026-07-27", cargo: "PLP", plant: "WA10", po: "5233464",
  },
]
