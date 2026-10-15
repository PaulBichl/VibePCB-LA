// Spike for the logic analyzer: can tscircuit + VibePCB route a 0.8 mm BGA (ECP5 LFE5U-25F, CABGA-256)
// with a length-matched SDRAM bus on 6 layers and pass KiCad's checks?
// Not a product board: power comes in on a header, no regulators / USB / input protection yet.
//
// Stack-up: top (signals + GND) / inner1 GND / inner2 (signals + GND) / inner3 3V3 plane /
// inner4 GND / bottom (signals + GND). 1.1 V core and 2.5 V aux are routed (6 + 2 balls).
// Ball choice (Lattice ECP5U-25 pinout, see ecp5_bg256.ts): the SDRAM on the outermost balls of banks
// 2/3 (the side facing it), the 16 inputs on the outer balls of banks 6/7 (facing the probe header).
import { LFE5U_25F_7BG256I } from "./imports/LFE5U_25F_7BG256I"
import { W9825G6KH_6 } from "./imports/W9825G6KH_6"

const SDRAM_DQ = Array.from({ length: 16 }, (_, i) => `DQ${i}`)
const SDRAM_CTRL = ["LDQM", "UDQM", "CLK", "CKE", "N_CS", "N_RAS", "N_CAS", "N_WE", "BS0", "BS1"]
const SDRAM_ADDR = Array.from({ length: 13 }, (_, i) => `A${i}`)
// balls of banks 2/3, outermost columns first, in row order (generated from the pinout)
const SDRAM_BALLS = ["B16", "B15", "C16", "C15", "C14", "D16", "D14", "E16", "E15", "E14", "F16", "F15", "F14",
  "G16", "G15", "G14", "H15", "H14", "J16", "J15", "J14", "K16", "K15", "K14", "L16", "L15", "L14", "M16", "M15",
  "M14", "N16", "N14", "P16", "P15", "P14", "R16", "R15", "R14", "T15"]
const SDRAM_SIGNALS = [...SDRAM_DQ, ...SDRAM_CTRL, ...SDRAM_ADDR]
const IN_BALLS = ["B1", "B2", "C1", "C2", "D1", "E1", "E2", "F1", "G1", "J1", "K1", "L1", "M1", "N1", "P1", "R1"]

const GND_BALLS = ["A1", "A16", "D15", "D2", "F8", "F9", "G10", "G8", "H1", "H10", "H16", "H8", "H9", "J10", "J8",
  "J9", "K10", "K6", "K7", "K8", "K9", "N15", "N2", "T1", "T12", "T16", "T5"]
const VCCIO_BALLS = ["F10", "F11", "F6", "F7", "H11", "H6", "H7", "J11", "J6", "J7", "K11", "L11", "L6"]
const VCC_BALLS = ["G6", "G7", "G9", "L10", "L8", "L9"]
const VCCAUX_BALLS = ["G11", "L7"]

const C100N = { footprint: "0402", supplierPartNumbers: { jlcpcb: ["C1525"] } }
const C10U = { footprint: "0603", supplierPartNumbers: { jlcpcb: ["C19702"] } }

export default () => (
  <board width="70mm" height="50mm" layers={6} minTraceWidth="0.1mm" defaultTraceWidth="0.1mm"
    minTraceToPadEdgeClearance="0.1mm" minViaEdgeToPadEdgeClearance="0.1mm" minViaHoleDiameter="0.2mm"
    minViaPadDiameter="0.4mm" minBoardEdgeClearance="0.5mm">
    <copperpour layer="top" connectsTo="net.GND" boardEdgeMargin="0.5mm" />
    <copperpour layer="inner1" connectsTo="net.GND" boardEdgeMargin="0.5mm" />
    <copperpour layer="inner2" connectsTo="net.GND" boardEdgeMargin="0.5mm" />
    <copperpour layer="inner3" connectsTo="net.V3V3" boardEdgeMargin="0.5mm" />
    <copperpour layer="inner4" connectsTo="net.GND" boardEdgeMargin="0.5mm" />
    <copperpour layer="bottom" connectsTo="net.GND" boardEdgeMargin="0.5mm" />

    <breakout name="FPGA_BREAKOUT" pcbX={-10} pcbY={0} width="28mm" height="28mm"
      fanoutRoutingLayers={["top", "inner2", "bottom"]} fanoutPourNetMap={{ inner1: "GND", inner3: "V3V3" }}
      busFanoutDirections={{ SDRAM_DQ: "center_right", SDRAM_CA: "center_right", INPUTS: "center_left" }}>
      <LFE5U_25F_7BG256I name="U1" />
      {GND_BALLS.map((b) => <trace key={b} name={`GND_${b}`} from={`.U1 > .${b}`} to="net.GND" />)}
      {VCCIO_BALLS.map((b) => <trace key={b} name={`VIO_${b}`} from={`.U1 > .${b}`} to="net.V3V3" />)}
    </breakout>
    {VCC_BALLS.map((b) => <trace key={b} from={`.U1 > .${b}`} to="net.V1V1" />)}
    {VCCAUX_BALLS.map((b) => <trace key={b} from={`.U1 > .${b}`} to="net.V2V5" />)}

    {/* FPGA decoupling: 1.1 V core, 2.5 V aux, 3.3 V IO */}
    {[0, 1, 2, 3].map((i) => (
      <capacitor key={`cc${i}`} name={`C${1 + i}`} capacitance="100nF" {...C100N} pcbX={-16 + i * 2} pcbY={16} />
    ))}
    <capacitor name="C5" capacitance="10uF" {...C10U} pcbX={-7} pcbY={16} />
    {[1, 2, 3, 4].map((i) => <trace key={`tc${i}`} from={`.C${i} > .pin1`} to="net.V1V1" />)}
    <trace from=".C5 > .pin1" to="net.V1V1" />
    <capacitor name="C6" capacitance="100nF" {...C100N} pcbX={-4} pcbY={16} />
    <capacitor name="C7" capacitance="100nF" {...C100N} pcbX={-2} pcbY={16} />
    <trace from=".C6 > .pin1" to="net.V2V5" />
    <trace from=".C7 > .pin1" to="net.V2V5" />
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <capacitor key={`cio${i}`} name={`C${8 + i}`} capacitance="100nF" {...C100N} pcbX={-16 + i * 2.4}
        pcbY={-16} />
    ))}
    {[8, 9, 10, 11, 12, 13].map((n) => <trace key={`tio${n}`} from={`.C${n} > .pin1`} to="net.V3V3" />)}
    {Array.from({ length: 13 }, (_, i) => i + 1).map((n) => (
      <trace key={`tg${n}`} from={`.C${n} > .pin2`} to="net.GND" />
    ))}

    {/* SDRAM */}
    <W9825G6KH_6 name="U2" pcbX={20} pcbY={0} />
    {SDRAM_SIGNALS.map((sig, i) => (
      <trace key={sig} name={`SD_${sig}`} from={`.U1 > .${SDRAM_BALLS[i]}`} to={`.U2 > .${sig}`} />
    ))}
    <bus name="SDRAM_DQ" connections={SDRAM_DQ.map((s) => `SD_${s}`)} maxLengthSkew="2mm" />
    <bus name="SDRAM_CA" connections={[...SDRAM_CTRL, ...SDRAM_ADDR].map((s) => `SD_${s}`)} maxLengthSkew="3mm" />
    {["VDD1", "VDD2", "VDD3", "VDDQ1", "VDDQ2", "VDDQ3", "VDDQ4"].map((p) => (
      <trace key={p} from={`.U2 > .${p}`} to="net.V3V3" />
    ))}
    {["VSS1", "VSS2", "VSS3", "VSSQ1", "VSSQ2", "VSSQ3", "VSSQ4"].map((p) => (
      <trace key={p} from={`.U2 > .${p}`} to="net.GND" />
    ))}
    {[0, 1, 2, 3].map((i) => (
      <capacitor key={`cs${i}`} name={`C${14 + i}`} capacitance="100nF" {...C100N} pcbX={13 + i * 4.5} pcbY={16} />
    ))}
    {[14, 15, 16, 17].map((n) => [
      <trace key={`ts${n}a`} from={`.C${n} > .pin1`} to="net.V3V3" />,
      <trace key={`ts${n}b`} from={`.C${n} > .pin2`} to="net.GND" />,
    ])}

    {/* inputs: 2x10 header, odd pins signals, even pins GND (pins 17-20 GND) */}
    <pinheader name="J1" pinCount={20} doubleRow pitch="2.54mm" pcbX={-30} pcbY={0} pcbRotation={90} />
    {IN_BALLS.map((b, i) => <trace key={`in${i}`} name={`IN_${i}`} from={`.U1 > .${b}`} to={`.J1 > .pin${i + 1}`} />)}
    <bus name="INPUTS" connections={IN_BALLS.map((_, i) => `IN_${i}`)} maxLengthSkew="5mm" />
    {[17, 18, 19, 20].map((p) => <trace key={`jg${p}`} from={`.J1 > .pin${p}`} to="net.GND" />)}

    {/* JTAG + power entry */}
    <pinheader name="J2" pinCount={6} pitch="2.54mm" pcbX={-8} pcbY={-21.5} />
    {[["T10", 3], ["R11", 4], ["M10", 5], ["T11", 6]].map(([b, p]) => (
      <trace key={`jt${b}`} from={`.U1 > .${b}`} to={`.J2 > .pin${p}`} />
    ))}
    <trace from=".J2 > .pin1" to="net.V3V3" />
    <trace from=".J2 > .pin2" to="net.GND" />
    <pinheader name="J3" pinCount={4} pitch="2.54mm" pcbX={20} pcbY={-20} />
    <trace from=".J3 > .pin1" to="net.GND" />
    <trace from=".J3 > .pin2" to="net.V3V3" />
    <trace from=".J3 > .pin3" to="net.V2V5" />
    <trace from=".J3 > .pin4" to="net.V1V1" />
  </board>
)
