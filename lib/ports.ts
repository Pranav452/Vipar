// Port coordinates for the trade-lane globe. [latitude, longitude]

export const ORIGIN = {
  name: "NHAVA SHEVA",
  label: "Nhava Sheva (JNPT), India",
  coords: [18.949, 72.951] as [number, number],
}

export const PORT_COORDS: Record<string, [number, number]> = {
  DJIBOUTI: [11.601, 43.148],
  "PORT BERBERA": [10.435, 45.014],
  SIHANOUKVILLE: [10.633, 103.503],
  YANGON: [16.78, 96.17],
  BEIRA: [-19.826, 34.873],
  LUANDA: [-8.787, 13.234],
  CASABLANCA: [33.602, -7.618],
  "LAEM CHABANG": [13.072, 100.893],
}

export function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split(" ")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ")
}
