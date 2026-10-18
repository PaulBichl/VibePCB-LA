// la-ecp5m: la-ecp5-escape routed by VibePCB ([routing] mode = "manual", routes.toml).
// BGA step 3 (VibePCB docs/TODO.md): ECP5 LFE5U-25F (CABGA-256, 0.8 mm) escaped by VibePCB ([escape.U1] in
// vibepcb.toml), routed to four headers. Not a product board: no regulators, power comes in on J5.
//
// Stack-up (6 layers, mechanically drilled through vias only): top signals + GND / inner1 GND / inner2 1.1 V
// plane (core) / inner3 3.3 V plane (all VCCIO) / inner4 GND / bottom signals + GND. Two full power planes
// instead of a split one: simpler, and the core / IO / GND balls are interleaved in the package centre.
// GND, 1.1 V and 3.3 V balls are via-only ([planes]); the two 2.5 V aux balls escape like signals and are routed.
// Signals: every IO ball of the outer two rings + 16 of ring 2 (dogbone + bottom), to the header on its side.
import { ECP5_BALLS } from "./ecp5_bg256"
import { LFE5U_25F_7BG256I } from "./imports/LFE5U_25F_7BG256I"

const ROWS = "ABCDEFGHJKLMNPRT"
const ballAt = (b: string) => ({ r: ROWS.indexOf(b[0]), c: Number(b.slice(1)) - 1 }) // A1 = row 0, column 0
const ring = (b: string) => {
  const { r, c } = ballAt(b)
  return Math.min(r, 15 - r, c, 15 - c)
}
// side of the package a ball is nearest to (A1 top left, as tscircuit's bga256 blorigin footprint places it)
const sideOf = (b: string): "N" | "E" | "S" | "W" => {
  const { r, c } = ballAt(b)
  const d = { N: r, S: 15 - r, W: c, E: 15 - c }
  return (Object.keys(d) as ("N" | "E" | "S" | "W")[]).reduce((a, k) => (d[k] < d[a] ? k : a), "N")
}
const along = (b: string) => {
  const { r, c } = ballAt(b)
  const s = sideOf(b)
  return s === "N" || s === "S" ? c : r
}
const fn = (b: string) => (ECP5_BALLS as Record<string, { fn: string }>)[b].fn
const balls = Object.keys(ECP5_BALLS)
const isIo = (b: string) => /^P[LRTB]\d/.test(fn(b))
const ofFn = (f: RegExp) => balls.filter((b) => f.test(fn(b)))

const RING2 = balls.filter((b) => isIo(b) && ring(b) === 2).sort().slice(0, 16)
const SIGNALS = [...balls.filter((b) => isIo(b) && ring(b) < 2), ...RING2]
const SIDES = ["N", "E", "S", "W"] as const
const bySide = Object.fromEntries(
  SIDES.map((s) => [s, SIGNALS.filter((b) => sideOf(b) === s).sort((a, b) => along(a) - along(b))]),
)
const HEADER_PINS = 32 // 2x16
// headers 27 mm out from the package centre (their 40.6 mm length clears the corners), along the package edge
const HEADER_AT = {
  N: { x: 0, y: 27, rot: 0 },
  S: { x: 0, y: -27, rot: 0 },
  E: { x: 27, y: 0, rot: 90 },
  W: { x: -27, y: 0, rot: 90 },
}
const HEADER_REF = { N: "J1", E: "J2", S: "J3", W: "J4" }

const C100N = { footprint: "0402", supplierPartNumbers: { jlcpcb: ["C1525"] } }
const C10U = { footprint: "0603", supplierPartNumbers: { jlcpcb: ["C19702"] } }
// decoupling at the four package corners (diagonal: the escapes leave the sides); [net, x, y]
const CAPS: [string, number, number, typeof C100N][] = [
  ["V1V1", -10, 10, C100N], ["V1V1", -12.6, 10, C100N], ["V1V1", 10, -10, C10U], ["V1V1", 13, -10, C100N],
  ["V3V3", 10, 10, C100N], ["V3V3", 12.6, 10, C100N], ["V3V3", -10, -10, C10U], ["V3V3", -13, -10, C100N],
  ["V2V5", -10, 11.8, C100N], ["V2V5", 10, -12, C100N],
]

export default () => (
  <board width="90mm" height="90mm" layers={6} minTraceWidth="0.1mm" defaultTraceWidth="0.15mm"
    minTraceToPadEdgeClearance="0.1mm" minViaEdgeToPadEdgeClearance="0.1mm" minViaHoleDiameter="0.2mm"
    minViaPadDiameter="0.4mm" minBoardEdgeClearance="0.5mm" routeRemaining>
    {/* inner layers are planes: `unbroken` keeps the router's tracks off them (vias may pass) */}
    {["top", "bottom"].map((layer) => (
      <copperpour key={layer} layer={layer} connectsTo="net.GND" boardEdgeMargin="0.5mm" />
    ))}
    {["inner1", "inner4"].map((layer) => (
      <copperpour key={layer} layer={layer} connectsTo="net.GND" boardEdgeMargin="0.5mm" unbroken />
    ))}
    <copperpour layer="inner2" connectsTo="net.V1V1" boardEdgeMargin="0.5mm" unbroken />
    <copperpour layer="inner3" connectsTo="net.V3V3" boardEdgeMargin="0.5mm" unbroken />

    {/* ======================== FPGA ======================== */}
    <LFE5U_25F_7BG256I name="U1" pcbX={0} pcbY={0} />
    {ofFn(/^GND$/).map((b) => <trace key={b} from={`.U1 > .${b}`} to="net.GND" />)}
    {ofFn(/^VCC$/).map((b) => <trace key={b} from={`.U1 > .${b}`} to="net.V1V1" />)}
    {ofFn(/^VCCIO\d$/).map((b) => <trace key={b} from={`.U1 > .${b}`} to="net.V3V3" />)}
    {ofFn(/^VCCAUX$/).map((b) => <trace key={b} from={`.U1 > .${b}`} to="net.V2V5" />)}
    {CAPS.map(([net, x, y, part], i) => [
      <capacitor key={`c${i}`} name={`C${i + 1}`} capacitance={part === C10U ? "10uF" : "100nF"} {...part}
        pcbX={x} pcbY={y} />,
      <trace key={`c${i}a`} from={`.C${i + 1} > .pin1`} to={`net.${net}`} />,
      <trace key={`c${i}b`} from={`.C${i + 1} > .pin2`} to="net.GND" />,
    ])}

    {/* ======================== signal headers (one per package side) ======================== */}
    {SIDES.map((s) => (
      <pinheader key={s} name={HEADER_REF[s]} pinCount={HEADER_PINS} doubleRow pitch="2.54mm"
        pcbX={HEADER_AT[s].x} pcbY={HEADER_AT[s].y} pcbRotation={HEADER_AT[s].rot} />
    ))}
    {SIDES.flatMap((s) =>
      bySide[s].slice(0, HEADER_PINS - 4).map((b, i) => (
        <trace key={`s${b}`} name={`IO_${b}`} from={`.U1 > .${b}`} to={`.${HEADER_REF[s]} > .pin${i + 1}`} />
      )),
    )}
    {SIDES.flatMap((s) =>
      [29, 30, 31, 32].map((p) => <trace key={`g${s}${p}`} from={`.${HEADER_REF[s]} > .pin${p}`} to="net.GND" />),
    )}

    {/* ======================== JTAG + power entry ======================== */}
    <pinheader name="J5" pinCount={10} doubleRow pitch="2.54mm" pcbX={31} pcbY={-31} />
    {[["TCK", 1], ["TMS", 2], ["TDI", 3], ["TDO", 4]].map(([f, p]) => (
      <trace key={`jt${f}`} name={`JTAG_${f}`} from={`.U1 > .${ofFn(new RegExp(`^${f}$`))[0]}`} to={`.J5 > .pin${p}`} />
    ))}
    <trace from=".J5 > .pin5" to="net.V3V3" />
    <trace from=".J5 > .pin6" to="net.V2V5" />
    <trace from=".J5 > .pin7" to="net.V1V1" />
    {[8, 9, 10].map((p) => <trace key={`jg${p}`} from={`.J5 > .pin${p}`} to="net.GND" />)}
    <silkscreentext text="LFE5U-25F escape test" pcbX={-28} pcbY={-36} fontSize="1.2mm" />
  </board>
)
