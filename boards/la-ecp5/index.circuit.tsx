// VibePCB logic analyzer, ECP5 version: 16 channels, 100 MSa/s into 32 MB SDRAM, read out over USB 2.0 HS.
// 98 x 64 mm, 6 layers: top signals + GND / inner1 GND / inner2 1.1 V core / inner3 3.3 V IO / inner4 GND /
// bottom signals + GND. Routed by VibePCB ([routing] mode = "manual", routes.toml); both BGAs escaped by VibePCB.
//
// - FPGA: Lattice LFE5U-25F (CABGA-256, 0.8 mm). Pins by package side, each group paired with the balls by
//   angle (planar: the routes need not cross): inputs + 100 MHz clock west (banks 6/7), SDRAM east (banks 2/3),
//   FT2232H FIFO north (banks 0/1), config SPI south (bank 8). Positions from `pcb padtable` (pads.ts):
//   build, `pcb padtable la-ecp5 U1 U2 U3 U6 U7 R50 R54 R81 R82`, build again.
// - Config: SPI master boot (CFG[2:0] = 010) from the W25Q128 on bank 8; FT2232H channel B (MPSSE) programs the
//   flash while it holds PROGRAMN low. JTAG on J5.
// - Inputs, bank rails, SDRAM, USB: as la-bga54m.
// - Power: 5 V -> TLV62569 3.3 V (IO), 1.1 V (core), 2.5 V (aux). < 3 W.
import { A_93LC56BT_I_OT } from "./imports/A_93LC56BT_I_OT"
import { FT2232HL_REEL } from "./imports/FT2232HL_REEL"
import { LFE5U_25F_7BG256I } from "./imports/LFE5U_25F_7BG256I"
import { KT_0603G } from "./imports/KT_0603G"
import { A_4D02WGJ0102TCE as RN1K } from "./imports/A_4D02WGJ0102TCE"
import { RTA02_4D105JTH as RN1M } from "./imports/RTA02_4D105JTH"
import { SRV05_4 } from "./imports/SRV05_4"
import { SN74LVC8T245PWR } from "./imports/SN74LVC8T245PWR"
import { SX3M100_000B20F30TNN } from "./imports/SX3M100_000B20F30TNN"
import { TLV62569DBVR } from "./imports/TLV62569DBVR"
import { TLV9062IDR } from "./imports/TLV9062IDR"
import { TYPE_C_31_M_12 } from "./imports/TYPE_C_31_M_12"
import { USBLC6_2SC6 } from "./imports/USBLC6_2SC6"
import { W25Q128JVSIQ } from "./imports/W25Q128JVSIQ"
import { IS42S16160J_7BLI } from "./imports/IS42S16160J_7BLI"
import { X322512MSB4SI } from "./imports/X322512MSB4SI"
import { ECP5_BALLS } from "./ecp5_bg256"
import { CENTRES, PADS } from "./pads"

// ---------------------------------------------------------------- parts helpers
const CAP: Record<string, [string, string]> = {
  "18pF": ["0402", "C1549"], "100nF": ["0402", "C1525"], "1uF": ["0402", "C52923"], "4.7uF": ["0603", "C19666"],
  "10uF": ["0603", "C19702"], "22uF": ["0805", "C45783"],
}
const RES: Record<string, string> = {
  "10": "C25077", "100": "C25076", "1k": "C11702", "5.1k": "C25905", "10k": "C25744", "12k": "C25752", "20k": "C25765",
  "22k": "C25768", "100k": "C25741", "1M": "C26083", "2.2k": "C25879", "330": "C25104",
}
const C = ({ name, v, ...p }: { name: string; v: string; [k: string]: unknown }) => (
  <capacitor name={name} capacitance={v} footprint={CAP[v][0]} supplierPartNumbers={{ jlcpcb: [CAP[v][1]] }} {...p} />
)
const R = ({ name, v, ...p }: { name: string; v: string; [k: string]: unknown }) => (
  <resistor name={name} resistance={v} footprint="0402" supplierPartNumbers={{ jlcpcb: [RES[v]] }} {...p} />
)
const net = (name: string, pins: string[]) => pins.map((p) => <trace key={`${name}:${p}`} from={p} to={`net.${name}`} />)

// ---------------------------------------------------------------- FPGA pin plan
type XY = readonly [number, number]
const FPGA_AT: XY = [-4, -2]
const ROWS = "ABCDEFGHJKLMNPRT"
const rc = (b: string) => ({ r: ROWS.indexOf(b[0]), c: Number(b.slice(1)) - 1 }) // A1 = row 0, column 0
const ring = (b: string) => {
  const { r, c } = rc(b)
  return Math.min(r, 15 - r, c, 15 - c)
}
// side of the package a ball is nearest to (A1 top left in the bga256 blorigin footprint)
const sideOf = (b: string): "N" | "E" | "S" | "W" => {
  const { r, c } = rc(b)
  const d = { N: r, S: 15 - r, W: c, E: 15 - c }
  return (Object.keys(d) as ("N" | "E" | "S" | "W")[]).reduce((x, k) => (d[k] < d[x] ? k : x), "N")
}
const BALLS = ECP5_BALLS as Record<string, { fn: string; bank: string; dual: string }>
const fn = (b: string) => BALLS[b].fn
const ofFn = (f: RegExp) => Object.keys(BALLS).filter((b) => f.test(fn(b)))
const ball = (f: string) => ofFn(new RegExp(`^${f}$`))[0]
const isIo = (b: string) => /^P[LRTB]\d/.test(fn(b))
// ball position on the board: from the placement build (pads.ts) once there is one, else from the 0.8 mm grid
const ballXY = (b: string): XY => {
  const { r, c } = rc(b)
  return PADS.U1?.[b] ?? [FPGA_AT[0] + (c - 7.5) * 0.8, FPGA_AT[1] + (7.5 - r) * 0.8]
}
const pinXY = (ref: string, pin: string): XY | undefined => PADS[ref]?.[pin]

// pair signals with FPGA balls without crossings. Two parts facing each other connect planar when both are
// read as a sweep around their own centre: the FPGA's balls from its far side over the top to the side facing
// the partner and on round the bottom, the partner's pins the other way round (from its far side over the top).
// The outermost arcs (far side, top) then pair up, the inner ones nest. The pool: the side's IO balls, outer
// rings first (fewer dogbones), the nearest to the partner among them
const used = new Set<string>()
const pairByAngle = (signals: [string, XY | undefined][], pool: string[], partner: XY | undefined) => {
  const free = pool.filter((b) => !used.has(b))
  const centre = partner ?? FPGA_AT
  const dist = (b: string) => Math.hypot(ballXY(b)[0] - centre[0], ballXY(b)[1] - centre[1])
  const chosen = [...free].sort((x, y) => ring(x) - ring(y) || dist(x) - dist(y)).slice(0, signals.length)
  if (chosen.length < signals.length) throw new Error(`pin plan: ${signals.length} signals, ${chosen.length} balls`)
  chosen.forEach((b) => used.add(b))
  if (!partner || signals.some(([, at]) => !at)) {
    // no placement build yet: any valid assignment, the next build pairs by angle
    return Object.fromEntries(signals.map(([name], i) => [name, chosen[i]]))
  }
  const norm = Math.hypot(partner[0] - FPGA_AT[0], partner[1] - FPGA_AT[1])
  const [ux, uy] = [(partner[0] - FPGA_AT[0]) / norm, (partner[1] - FPGA_AT[1]) / norm]
  // angle around `from`, 0 = towards `facing` (unit vector), +90 = its left, +-180 = the far side
  const angle = (p: XY, from: XY, fx: number, fy: number) => {
    const [vx, vy] = [p[0] - from[0], p[1] - from[1]]
    return Math.atan2(fx * vy - fy * vx, fx * vx + fy * vy)
  }
  const bs = [...chosen].sort((x, y) => angle(ballXY(y), FPGA_AT, ux, uy) - angle(ballXY(x), FPGA_AT, ux, uy))
  const ss = [...signals].sort((x, y) => angle(x[1] as XY, partner, -ux, -uy) - angle(y[1] as XY, partner, -ux, -uy))
  return Object.fromEntries(ss.map(([name], i) => [name, bs[i]]))
}
const ioOn = (side: string) => Object.keys(BALLS).filter((b) => isIo(b) && sideOf(b) === side && BALLS[b].bank !== "8")

// fixed balls: configuration, JTAG, clock inputs
const CFG = { CCLK: ball("CCLK"), MOSI: "T8", MISO: "T7", CSSPIN: "N8", PROGRAMN: ball("PROGRAMN"),
  INITN: ball("INITN"), DONE: ball("DONE"), CFG_0: ball("CFG_0"), CFG_1: ball("CFG_1"), CFG_2: ball("CFG_2") }
const CLK100_BALL = "M1" // PCLKT6_0, west
const FT_CLKOUT_BALL = "A7" // PCLKT0_0, north
used.add(CLK100_BALL)
used.add(FT_CLKOUT_BALL)

const SDRAM_DQ = Array.from({ length: 16 }, (_, i) => `DQ${i}`)
const SDRAM_CA = ["LDQM", "UDQM", "CLK", "CKE", "N_CS", "N_RAS", "N_CAS", "N_WE", "BS0", "BS1",
  ...Array.from({ length: 13 }, (_, i) => `A${i}`)]
// 39 signals: more than the east side's two outer rings hold, so the outer rings of the whole east half (both
// east corners); deeper balls would need dogbones the escape cannot fit between this many neighbours
const EAST_HALF = Object.keys(BALLS).filter((b) => isIo(b) && BALLS[b].bank !== "8" && ring(b) <= 1 && rc(b).c >= 8)
const SDRAM_PIN = pairByAngle([...SDRAM_DQ, ...SDRAM_CA].map((s) => [s, pinXY("U2", s)]), EAST_HALF, CENTRES.U2)

// FT2232H channel A, 245 synchronous FIFO; CLKOUT (60 MHz) on a primary clock input
const FIFO_SIGNALS = ["ADBUS0", "ADBUS1", "ADBUS2", "ADBUS3", "ADBUS4", "ADBUS5", "ADBUS6", "ADBUS7", "ACBUS0",
  "ACBUS1", "ACBUS2", "ACBUS3", "ACBUS4", "ACBUS6"]
const FIFO_PIN: Record<string, string> = {
  ...pairByAngle(FIFO_SIGNALS.map((s) => [s, pinXY("U3", s)]), ioOn("N"), CENTRES.U3),
  ACBUS5: FT_CLKOUT_BALL,
}
const FIFO_NAMES: Record<string, string> = {
  ACBUS0: "FT_RXF_N", ACBUS1: "FT_TXE_N", ACBUS2: "FT_RD_N", ACBUS3: "FT_WR_N", ACBUS4: "FT_SIWU",
  ACBUS5: "FT_CLKOUT", ACBUS6: "FT_OE_N",
}

// inputs: CH0-7 from U6, CH8-15 from U7 (B side), west
const CH = Array.from({ length: 16 }, (_, ch) => `CH${ch}`)
const CH_AT = (ch: number) => pinXY(ch < 8 ? "U6" : "U7", `B${(ch % 8) + 1}`)
const IN_PIN = pairByAngle(CH.map((n, ch) => [n, CH_AT(ch)]), ioOn("W"), CENTRES.U6 && CENTRES.U7
  ? [(CENTRES.U6[0] + CENTRES.U7[0]) / 2, (CENTRES.U6[1] + CENTRES.U7[1]) / 2] : undefined)

// bank-rail PWM (bottom left) and LEDs (bottom right): south side, the balls not used for configuration
const SOUTH = Object.keys(BALLS).filter((b) => isIo(b) && sideOf(b) === "S" && BALLS[b].dual === "-")
const PWM_PIN = pairByAngle([["PWM_A", pinXY("R50", "pin1")], ["PWM_B", pinXY("R54", "pin1")]], SOUTH, CENTRES.R50)
const LED_PIN = pairByAngle([["LED_ACT", pinXY("R81", "pin2")], ["LED_TRIG", pinXY("R82", "pin2")]], SOUTH,
  CENTRES.R81)

// probe header J1: rows top to bottom as (left, right); tscircuit's pin numbers of those positions
const HEADER_ROWS = [["CH0", "CH1"], ["CH2", "CH3"], ["CH4", "CH5"], ["CH6", "CH7"], ["GND", "GND"],
  ["CH8", "CH9"], ["CH10", "CH11"], ["CH12", "CH13"], ["CH14", "CH15"], ["GND", "GND"]]
const HEADER_LEFT = [12, 13, 14, 15, 16, 17, 18, 19, 20, 1]
const HEADER_RIGHT = [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]
const HEADER_PIN: Record<string, number> = Object.fromEntries(
  HEADER_ROWS.flatMap(([l, r], k) => [[l, HEADER_LEFT[k]], [r, HEADER_RIGHT[k]]]).filter(([n]) => n !== "GND"),
)
const HEADER_GND_PINS = HEADER_ROWS.flatMap(([l, r], k) => [
  ...(l === "GND" ? [HEADER_LEFT[k]] : []), ...(r === "GND" ? [HEADER_RIGHT[k]] : []),
])

export default () => (
  <board outline={[{ x: -53, y: 32 }, { x: 45, y: 32 }, { x: 45, y: -32 }, { x: -53, y: -32 }]} layers={6} minTraceWidth="0.1mm" defaultTraceWidth="0.15mm"
    minTraceToPadEdgeClearance="0.1mm" minViaEdgeToPadEdgeClearance="0.1mm" minViaHoleDiameter="0.2mm"
    minViaPadDiameter="0.4mm" minBoardEdgeClearance="0.5mm" routeRemaining>
    {["top", "inner1", "inner4", "bottom"].map((layer) => (
      <copperpour key={layer} layer={layer} connectsTo="net.GND" boardEdgeMargin="0.5mm" />
    ))}
    <copperpour layer="inner2" connectsTo="net.V1V1" boardEdgeMargin="0.5mm" />
    <copperpour layer="inner3" connectsTo="net.V3V3" boardEdgeMargin="0.5mm" />

    {/* ======================== FPGA ======================== */}
    <LFE5U_25F_7BG256I name="U1" pcbX={FPGA_AT[0]} pcbY={FPGA_AT[1]} />
    {net("GND", ofFn(/^GND$/).map((b) => `.U1 > .${b}`))}
    {net("V1V1", ofFn(/^VCC$/).map((b) => `.U1 > .${b}`))}
    {net("V2V5", ofFn(/^VCCAUX$/).map((b) => `.U1 > .${b}`))}
    {net("V3V3", ofFn(/^VCCIO\d$/).map((b) => `.U1 > .${b}`))}
    {/* decoupling at the package corners (diagonal: the escapes leave the sides): 1.1 V core, 3.3 V IO, 2.5 V aux */}
    {[[-14, 8], [-12, 8], [6, -12], [8, -12]].map(([x, y], i) => (
      <C key={`cv${i}`} name={`C${1 + i}`} v="100nF" pcbX={x} pcbY={y} />
    ))}
    <C name="C5" v="10uF" pcbX={10.5} pcbY={-12} />
    {net("V1V1", [1, 2, 3, 4, 5].map((n) => `.C${n} > .pin1`))}
    {[[6, 8], [8, 8], [-14, -12], [-12, -12], [-14, -14], [-12, -14]].map(([x, y], i) => (
      <C key={`ci${i}`} name={`C${6 + i}`} v="100nF" pcbX={x} pcbY={y} />
    ))}
    <C name="C12" v="10uF" pcbX={10.5} pcbY={8} />
    {net("V3V3", [6, 7, 8, 9, 10, 11, 12].map((n) => `.C${n} > .pin1`))}
    <C name="C40" v="10uF" pcbX={-14} pcbY={10.5} />
    <C name="C41" v="100nF" pcbX={-11.5} pcbY={10.5} />
    {net("V2V5", [".C40 > .pin1", ".C41 > .pin1"])}
    {net("GND", [...Array.from({ length: 12 }, (_, i) => `.C${i + 1} > .pin2`), ".C40 > .pin2", ".C41 > .pin2"])}
    {/* 100 MHz sample clock into a primary clock input on the west side */}
    <SX3M100_000B20F30TNN name="Y2" pcbX={-10} pcbY={-21} />
    <C name="C13" v="100nF" pcbX={-10} pcbY={-24.5} />
    <trace name="CLK100" from=".Y2 > .OUT" to={`.U1 > .${CLK100_BALL}`} />
    {net("V3V3", [".Y2 > .VDD", ".Y2 > .TRI_STATE", ".C13 > .pin1"])}
    {net("GND", [".Y2 > .GND", ".C13 > .pin2"])}

    {/* ======================== SDRAM ======================== */}
    <IS42S16160J_7BLI name="U2" pcbX={24} pcbY={-2} pcbRotation={90} />
    {[...SDRAM_DQ, ...SDRAM_CA].map((sig) => (
      <trace key={sig} name={`SD_${sig}`} from={`.U1 > .${SDRAM_PIN[sig]}`} to={`.U2 > .${sig}`} />
    ))}
    {net("V3V3", ["VDD1", "VDD2", "VDD3", "VDDQ1", "VDDQ2", "VDDQ3", "VDDQ4"].map((p) => `.U2 > .${p}`))}
    {net("GND", ["VSS1", "VSS2", "VSS3", "VSSQ1", "VSSQ2", "VSSQ3", "VSSQ4"].map((p) => `.U2 > .${p}`))}
    {[0, 1, 2, 3].map((i) => <C key={`cs${i}`} name={`C${14 + i}`} v="100nF" pcbX={33} pcbY={-11 + i * 6}
      pcbRotation={90} />)}
    {net("V3V3", [14, 15, 16, 17].map((n) => `.C${n} > .pin1`))}
    {net("GND", [14, 15, 16, 17].map((n) => `.C${n} > .pin2`))}

    {/* ======================== USB: USB-C, ESD, FT2232H ======================== */}
    <TYPE_C_31_M_12 name="J2" pcbX={-26} pcbY={27.5} pcbRotation={180} />
    <R name="R1" v="5.1k" pcbX={-32} pcbY={22} />
    <R name="R2" v="5.1k" pcbX={-20} pcbY={22} />
    <trace from=".J2 > .CC1" to=".R1 > .pin1" />
    <trace from=".J2 > .CC2" to=".R2 > .pin1" />
    {net("GND", [".R1 > .pin2", ".R2 > .pin2", ".J2 > .GND1", ".J2 > .GND2", ".J2 > .EH1", ".J2 > .EH2", ".J2 > .EH3",
      ".J2 > .EH4"])}
    {net("V5", [".J2 > .VBUS1", ".J2 > .VBUS2"])}
    {/* USBLC6 channels are identical: D+ on IO2, D- on IO1 keeps the pair's P / N order the same at both ends */}
    <USBLC6_2SC6 name="U4" pcbX={-15} pcbY={24} pcbRotation={270} />
    <trace name="USB_C_P" from=".J2 > .DP1" to=".U4 > .IO2_A" />
    <trace name="USB_C_N" from=".J2 > .DN1" to=".U4 > .IO1_A" />
    <trace from=".J2 > .DP2" to=".J2 > .DP1" />
    <trace from=".J2 > .DN2" to=".J2 > .DN1" />
    {net("V5", [".U4 > .VBUS"])}
    {net("GND", [".U4 > .GND"])}
    <FT2232HL_REEL name="U3" pcbX={2} pcbY={22} />
    <trace name="USB_P" from=".U4 > .IO2_B" to=".U3 > .DP" />
    <trace name="USB_N" from=".U4 > .IO1_B" to=".U3 > .DM" />
    <differentialpair name="USB" positiveConnection="USB_P" negativeConnection="USB_N" maxLengthSkew={0.15} />
    {Object.entries(FIFO_PIN).map(([ft, b]) => (
      <trace key={ft} name={FIFO_NAMES[ft] ?? `FT_D${ft.slice(-1)}`} from={`.U3 > .${ft}`} to={`.U1 > .${b}`} />
    ))}
    <R name="R3" v="12k" pcbX={-6} pcbY={14.5} />
    <trace from=".U3 > .REF" to=".R3 > .pin1" />
    <X322512MSB4SI name="Y1" pcbX={-9} pcbY={21} loadCapacitance="12pF" />
    <C name="C18" v="18pF" pcbX={-12} pcbY={19} />
    <C name="C19" v="18pF" pcbX={-12} pcbY={16.5} />
    <trace from=".U3 > .OSCI" to=".Y1 > .pin1" />
    <trace from=".U3 > .OSCO" to=".Y1 > .pin3" />
    <trace from=".Y1 > .pin1" to=".C18 > .pin1" />
    <trace from=".Y1 > .pin3" to=".C19 > .pin1" />
    {net("GND", [".Y1 > .pin2", ".Y1 > .pin4", ".C18 > .pin2", ".C19 > .pin2", ".R3 > .pin2", ".U3 > .TEST", ".U3 > .AGND",
      ...["GND1", "GND2", "GND3", "GND4", "GND5", "GND6", "GND7", "GND8"].map((g) => `.U3 > .${g}`)])}
    {net("V3V3", [".U3 > .VREGIN", ".U3 > .VPHY", ".U3 > .VPLL", ".U3 > .VCCIO1", ".U3 > .VCCIO2", ".U3 > .VCCIO3",
      ".U3 > .VCCIO4"])}
    {net("V1V8", [".U3 > .VREGOUT", ".U3 > .VCORE1", ".U3 > .VCORE2", ".U3 > .VCORE3"])}
    <R name="R4" v="10k" pcbX={12} pcbY={15} />
    <trace from=".U3 > .N_RESET" to=".R4 > .pin1" />
    {net("V3V3", [".R4 > .pin2"])}
    {[0, 1, 2, 3].map((i) => <C key={`cf${i}`} name={`C${20 + i}`} v="100nF" pcbX={11 + i * 2} pcbY={29} />)}
    {net("V3V3", [".C20 > .pin1", ".C21 > .pin1"])}
    {net("V1V8", [".C22 > .pin1", ".C23 > .pin1"])}
    <C name="C24" v="4.7uF" pcbX={19.5} pcbY={29} />
    {net("V1V8", [".C24 > .pin1"])}
    {net("GND", [20, 21, 22, 23, 24].map((n) => `.C${n} > .pin2`))}
    {/* EEPROM (FIFO mode), 93LC56 in 16-bit mode: DI via 2.2k from DO per the FT2232H datasheet */}
    <A_93LC56BT_I_OT name="U5" pcbX={13} pcbY={21} />
    <trace from=".U3 > .EECS" to=".U5 > .CS" />
    <trace from=".U3 > .EECLK" to=".U5 > .CLK" />
    <trace from=".U3 > .EEDATA" to=".U5 > .DI" />
    <R name="R5" v="2.2k" pcbX={13} pcbY={24.5} />
    <trace from=".U5 > .DI" to=".R5 > .pin1" />
    <trace from=".U5 > .DO" to=".R5 > .pin2" />
    {net("V3V3", [".U5 > .VCC"])}
    {net("GND", [".U5 > .VSS"])}

    {/* ======================== config: SPI flash (master SPI boot), FT2232H B programs it ======================== */}
    <W25Q128JVSIQ name="U9" pcbX={12} pcbY={-21} />
    <trace name="SPI_SCK" from={`.U1 > .${CFG.CCLK}`} to=".U9 > .CLK" />
    <trace name="SPI_SS_N" from={`.U1 > .${CFG.CSSPIN}`} to=".U9 > .N_CS" />
    <trace name="SPI_COPI" from={`.U1 > .${CFG.MOSI}`} to=".U9 > .DI" />
    <trace name="SPI_CIPO" from={`.U1 > .${CFG.MISO}`} to=".U9 > .DO" />
    {net("SPI_SCK", [".U3 > .BDBUS0"])}
    {net("SPI_COPI", [".U3 > .BDBUS1"])}
    {net("SPI_CIPO", [".U3 > .BDBUS2"])}
    {net("SPI_SS_N", [".U3 > .BDBUS4"])}
    {net("FPGA_DONE", [`.U1 > .${CFG.DONE}`, ".U3 > .BDBUS6"])}
    {net("FPGA_PROGRAMN", [`.U1 > .${CFG.PROGRAMN}`, ".U3 > .BDBUS7"])}
    {net("FPGA_INITN", [`.U1 > .${CFG.INITN}`])}
    {/* pull-ups: flash select, DONE, PROGRAMN, INITN; CFG[2:0] = 010 = master SPI (CFG_1 high, 0 and 2 low) */}
    {[["R6", "SPI_SS_N"], ["R7", "FPGA_DONE"], ["R8", "FPGA_PROGRAMN"], ["R9", "FPGA_INITN"], ["R10", "FPGA_CFG1"]].map(
      ([r, n], i) => [
        <R key={r} name={r} v="10k" pcbX={16 + i * 2} pcbY={-17} pcbRotation={90} />,
        ...net(n, [`.${r} > .pin1`]),
        ...net("V3V3", [`.${r} > .pin2`]),
      ],
    )}
    {net("FPGA_CFG1", [`.U1 > .${CFG.CFG_1}`])}
    {net("GND", [`.U1 > .${CFG.CFG_0}`, `.U1 > .${CFG.CFG_2}`])}
    {net("V3V3", [".U9 > .VCC", ".U9 > .IO2", ".U9 > .IO3"])}
    {net("GND", [".U9 > .GND"])}
    <C name="C25" v="100nF" pcbX={12} pcbY={-28} />
    {net("V3V3", [".C25 > .pin1"])}
    {net("GND", [".C25 > .pin2"])}
    {/* JTAG (pins 1-4) for debugging, 3.3 V reference, GND */}
    <pinheader name="J5" pinCount={10} doubleRow pitch="2.54mm" pcbX={-2} pcbY={-27} showSilkscreenPinLabels
      pinLabels={["TCK", "TMS", "TDI", "TDO", "3V3", "GND", "GND", "GND", "GND", "GND"]} />
    {[["TCK", 1], ["TMS", 2], ["TDI", 3], ["TDO", 4]].map(([f, p]) => (
      <trace key={`jt${f}`} name={`JTAG_${f}`} from={`.U1 > .${ball(String(f))}`} to={`.J5 > .pin${p}`} />
    ))}
    {net("V3V3", [".J5 > .pin5"])}
    {net("GND", [6, 7, 8, 9, 10].map((p) => `.J5 > .pin${p}`))}

    {/* ======================== inputs ======================== */}
    {/* probe header: row by row, bank A (CH0-7) on top, a GND row, bank B (CH8-15), a GND row; tscircuit numbers
        this 2x10 around the block (left column 12..20 + 1 top to bottom, right 11..2), not like an IDC header,
        so every pin is labelled */}
    <pinheader name="J1" pinCount={20} doubleRow pitch="2.54mm" pcbX={-47} pcbY={-2} pcbRotation={90} />
    {HEADER_ROWS.flatMap(([left, right], k) => {
      const y = -2 + 11.43 - k * 2.54
      return [
        <silkscreentext key={`hl${k}`} text={left} pcbX={-49.4} pcbY={y} fontSize="0.8mm" anchorAlignment="center_right" />,
        <silkscreentext key={`hr${k}`} text={right} pcbX={-44.6} pcbY={y} fontSize="0.8mm" anchorAlignment="center_left" />,
      ]
    })}
    <silkscreentext text="A: CH0-7" pcbX={-47} pcbY={12.3} fontSize="1mm" />
    <silkscreentext text="B: CH8-15" pcbX={-47} pcbY={-16.3} fontSize="1mm" />
    {net("GND", HEADER_GND_PINS.map((p) => `.J1 > .pin${p}`))}
    {/* per group of 4 channels: 1k series array, 1M pull-down array, SRV05-4 clamp (steering diodes to the
        bank rail / GND, 0.3 pF). Array element k: pins k+1 and 8-k */}
    {[0, 1, 2, 3].map((g) => {
      const y = 8 - g * 6
      const bank = g < 2 ? "A" : "B"
      return [
        <RN1K key={`rs${g}`} name={`RN${1 + g}`} pcbX={-36} pcbY={y} pcbRotation={90} />,
        <RN1M key={`rp${g}`} name={`RN${5 + g}`} pcbX={-33} pcbY={y} pcbRotation={90} />,
        <SRV05_4 key={`d${g}`} name={`D${1 + g}`} pcbX={-29} pcbY={y} />,
        ...net("GND", [`.D${1 + g} > .GND`]),
        ...net(`VIO_${bank}`, [`.D${1 + g} > .VDD`]),
        ...[0, 1, 2, 3].flatMap((k) => {
          const ch = g * 4 + k
          const u = ch < 8 ? "U6" : "U7"
          return [
            <trace key={`ti${ch}`} from={`.J1 > .pin${HEADER_PIN[`CH${ch}`]}`} to={`.RN${1 + g} > .pin${k + 1}`} />,
            ...net(`IN${ch}`, [`.RN${1 + g} > .pin${8 - k}`, `.RN${5 + g} > .pin${k + 1}`, `.D${1 + g} > .IO${k + 1}`,
              `.${u} > .A${(ch % 8) + 1}`]),
            ...net("GND", [`.RN${5 + g} > .pin${8 - k}`]),
            <trace key={`tb${ch}`} name={`CH${ch}`} from={`.${u} > .B${(ch % 8) + 1}`} to={`.U1 > .${IN_PIN[`CH${ch}`]}`} />,
          ]
        }),
      ]
    })}
    <SN74LVC8T245PWR name="U6" pcbX={-21} pcbY={4} />
    <SN74LVC8T245PWR name="U7" pcbX={-21} pcbY={-8} />
    {[["U6", "A"], ["U7", "B"]].map(([u, bank]) => [
      ...net(`VIO_${bank}`, [`.${u} > .VCCA`, `.${u} > .DIR`]),
      ...net("V3V3", [`.${u} > .VCCB1`, `.${u} > .VCCB2`]),
      ...net("GND", [`.${u} > .GND1`, `.${u} > .GND2`, `.${u} > .GND3`, `.${u} > .N_OE`]),
    ])}
    {/* bank rails: FPGA PWM -> 10k / 1uF -> TLV9062, gain 1.5 (10k / 20k) -> 10R -> rail caps */}
    <TLV9062IDR name="U8" pcbX={-24} pcbY={-21} />
    {net("V5", [".U8 > .VPOS"])}
    {net("GND", [".U8 > .VNEG"])}
    {[["A", "1", PWM_PIN.PWM_A, 0], ["B", "2", PWM_PIN.PWM_B, 1]].map(([bank, n, pin, i]) => {
      const x = -31 + Number(i) * 3
      return [
        <R key={`rf${bank}`} name={`R${50 + Number(i) * 4}`} v="10k" pcbX={x} pcbY={-16} pcbRotation={90} />,
        <C key={`cf${bank}`} name={`C${30 + Number(i) * 3}`} v="1uF" pcbX={x} pcbY={-19} pcbRotation={90} />,
        <R key={`rg${bank}`} name={`R${51 + Number(i) * 4}`} v="10k" pcbX={x} pcbY={-23} pcbRotation={90} />,
        <R key={`rh${bank}`} name={`R${52 + Number(i) * 4}`} v="20k" pcbX={x} pcbY={-26} pcbRotation={90} />,
        <R key={`ri${bank}`} name={`R${53 + Number(i) * 4}`} v="10" pcbX={-18 + Number(i) * 2.5} pcbY={-16}
          pcbRotation={90} />,
        <C key={`cr${bank}`} name={`C${31 + Number(i) * 3}`} v="1uF" pcbX={-18 + Number(i) * 2.5} pcbY={-13}
          pcbRotation={90} />,
        <C key={`cs${bank}`} name={`C${32 + Number(i) * 3}`} v="100nF" pcbX={bank === "A" ? -16 : -16}
          pcbY={bank === "A" ? 4 : -8} pcbRotation={90} />,
        <trace key={`pwm${bank}`} name={`PWM_${bank}`} from={`.U1 > .${pin}`} to={`.R${50 + Number(i) * 4} > .pin1`} />,
        ...net(`VSET_${bank}`, [`.R${50 + Number(i) * 4} > .pin2`, `.C${30 + Number(i) * 3} > .pin1`,
          `.U8 > .IN${n}_P`]),
        ...net(`VFB_${bank}`, [`.U8 > .IN${n}_N`, `.R${51 + Number(i) * 4} > .pin1`, `.R${52 + Number(i) * 4} > .pin1`]),
        ...net(`VDRV_${bank}`, [`.U8 > .OUT${n}`, `.R${52 + Number(i) * 4} > .pin2`, `.R${53 + Number(i) * 4} > .pin1`]),
        ...net(`VIO_${bank}`, [`.R${53 + Number(i) * 4} > .pin2`, `.C${31 + Number(i) * 3} > .pin1`,
          `.C${32 + Number(i) * 3} > .pin1`]),
        ...net("GND", [`.C${30 + Number(i) * 3} > .pin2`, `.R${51 + Number(i) * 4} > .pin2`,
          `.C${31 + Number(i) * 3} > .pin2`, `.C${32 + Number(i) * 3} > .pin2`]),
      ]
    })}
    <C name="C36" v="100nF" pcbX={-24} pcbY={-25.5} />
    {net("V5", [".C36 > .pin1"])}
    {net("GND", [".C36 > .pin2"])}

    {/* ======================== power: 5 V -> 3.3 V, 1.1 V, 2.5 V ======================== */}
    {/* TLV62569: Vout = 0.6 V x (1 + Rtop / Rbot): 100k/22k = 3.33 V, 10k/12k = 1.10 V, (22k + 10k)/10k = 2.52 V */}
    {[["U10", "V3V3", ["100k"], "22k", 30, 24, 0], ["U11", "V1V1", ["10k"], "12k", 30, 16, 1],
      ["U12", "V2V5", ["22k", "10k"], "10k", 30, -17, 2]].map(([u, rail, rtop, rbot, x, y, i]) => {
      const n = [60, 70, 90][Number(i)]
      const [cx, cy] = [Number(x), Number(y)]
      const tops = rtop as string[]
      return [
        <TLV62569DBVR key={String(u)} name={String(u)} pcbX={cx} pcbY={cy} />,
        <inductor key={`l${u}`} name={`L${1 + Number(i)}`} inductance="2.2uH" footprint="0805"
          supplierPartNumbers={{ jlcpcb: ["C63167"] }} pcbX={cx + 5.5} pcbY={cy} pcbRotation={90} />,
        <C key={`ci${u}`} name={`C${n}`} v="10uF" pcbX={cx - 4} pcbY={cy} pcbRotation={90} />,
        <C key={`co${u}`} name={`C${n + 1}`} v="22uF" pcbX={cx + 9} pcbY={cy} pcbRotation={90} />,
        ...tops.map((v, k) => <R key={`rt${u}${k}`} name={`R${n + 2 + k}`} v={v} pcbX={cx - 2 + k * 2.5} pcbY={cy - 3} />),
        <R key={`rb${u}`} name={`R${n + 1}`} v={String(rbot)} pcbX={cx + 3 + (tops.length - 1) * 2.5} pcbY={cy - 3} />,
        ...net("V5", [`.${u} > .VIN`, `.${u} > .EN`, `.C${n} > .pin1`]),
        ...net(`SW_${rail}`, [`.${u} > .SW`, `.L${1 + Number(i)} > .pin1`]),
        ...net(String(rail), [`.L${1 + Number(i)} > .pin2`, `.C${n + 1} > .pin1`, `.R${n + 2} > .pin1`]),
        ...(tops.length > 1 ? net(`FB_${rail}_MID`, [`.R${n + 2} > .pin2`, `.R${n + 3} > .pin1`]) : []),
        ...net(`FB_${rail}`, [`.${u} > .FB`, `.R${n + 1 + tops.length} > .pin2`, `.R${n + 1} > .pin1`]),
        ...net("GND", [`.${u} > .GND`, `.C${n} > .pin2`, `.C${n + 1} > .pin2`, `.R${n + 1} > .pin2`]),
      ]
    })}

    {/* ======================== silkscreen ======================== */}
    <silkscreentext text="VibePCB LA16 ECP5 rev 1" pcbX={-28} pcbY={-30} fontSize="1.2mm" />
    <silkscreentext text="USB-C 5V" pcbX={-26} pcbY={20.5} fontSize="1mm" />
    {["PWR", "ACT", "TRIG"].map((t, i) => (
      <silkscreentext key={t} text={t} pcbX={32 + i * 3} pcbY={-29.5} fontSize="0.8mm" />
    ))}

    {/* ======================== LEDs ======================== */}
    {[["D20", "V3V3", null], ["D21", "LED_ACT", LED_PIN.LED_ACT], ["D22", "LED_TRIG", LED_PIN.LED_TRIG]].map(([d, n, pin], i) => [
      <KT_0603G key={String(d)} name={String(d)} pcbX={32 + i * 3} pcbY={-27} />,
      <R key={`r${d}`} name={`R${80 + i}`} v="330" pcbX={32 + i * 3} pcbY={-24} pcbRotation={90} />,
      ...(pin ? [<trace key={`tl${d}`} name={String(n)} from={`.U1 > .${pin}`} to={`.R${80 + i} > .pin2`} />]
        : net("V3V3", [`.R${80 + i} > .pin2`])),
      <trace key={`ta${d}`} from={`.R${80 + i} > .pin1`} to={`.${d} > .anode`} />,
      ...net("GND", [`.${d} > .cathode`]),
    ])}
  </board>
)
