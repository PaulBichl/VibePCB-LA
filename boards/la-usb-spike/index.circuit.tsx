// Spike for the logic analyzer: USB 2.0 HS differential pairs (USB-C -> USBLC6 ESD -> FT2232H) on 6 layers,
// with KiCad net classes / diff-pair rules from vibepcb.toml. Not a product board (no EEPROM, FIFO pins to headers).
//
// The ESD part sits in the lines (flow-through), so each line is two nets: connector side USB_C_P/N,
// chip side USB_P/N; both are pairs (KiCad finds pairs by the _P/_N suffix of the net names).
import { AP2112K_3_3TRG1 } from "./imports/AP2112K_3_3TRG1"
import { FT2232HL_REEL } from "./imports/FT2232HL_REEL"
import { TYPE_C_31_M_12 } from "./imports/TYPE_C_31_M_12"
import { USBLC6_2SC6 } from "./imports/USBLC6_2SC6"
import { X322512MSB4SI } from "./imports/X322512MSB4SI"

const C100N = { footprint: "0402", supplierPartNumbers: { jlcpcb: ["C1525"] } }
const C4U7 = { footprint: "0603", supplierPartNumbers: { jlcpcb: ["C19666"] } }
const R = (jlc: string) => ({ footprint: "0402", supplierPartNumbers: { jlcpcb: [jlc] } })
const net = (name: string, pins: string[]) => pins.map((p) => <trace key={`${name}:${p}`} from={p} to={`net.${name}`} />)

export default () => (
  <board width="45mm" height="35mm" layers={6} minTraceWidth="0.1mm" defaultTraceWidth="0.15mm"
    minTraceToPadEdgeClearance="0.1mm" minViaEdgeToPadEdgeClearance="0.1mm" minViaHoleDiameter="0.2mm"
    minViaPadDiameter="0.4mm" minBoardEdgeClearance="0.5mm" routeRemaining>
    {["top", "inner1", "inner2", "inner4", "bottom"].map((layer) => (
      <copperpour key={layer} layer={layer} connectsTo="net.GND" boardEdgeMargin="0.5mm" />
    ))}
    <copperpour layer="inner3" connectsTo="net.V3V3" boardEdgeMargin="0.5mm" />

    {/* USB-C (device: 5.1k on CC1 / CC2) */}
    <TYPE_C_31_M_12 name="J1" pcbX={-18} pcbY={0} pcbRotation={-90} />
    <resistor name="R1" resistance="5.1k" {...R("C25905")} pcbX={-15} pcbY={7} />
    <resistor name="R2" resistance="5.1k" {...R("C25905")} pcbX={-15} pcbY={-7} />
    <trace from=".J1 > .CC1" to=".R1 > .pin1" />
    <trace from=".J1 > .CC2" to=".R2 > .pin1" />
    {net("GND", [".R1 > .pin2", ".R2 > .pin2", ".J1 > .GND1", ".J1 > .GND2", ".J1 > .EH1", ".J1 > .EH2",
      ".J1 > .EH3", ".J1 > .EH4"])}
    {net("VBUS", [".J1 > .VBUS1", ".J1 > .VBUS2"])}

    {/* ESD, flow-through: IO1 = D+, IO2 = D- */}
    <USBLC6_2SC6 name="U2" pcbX={-11} pcbY={0} pcbRotation={90} />
    <trace name="USB_C_P" from=".J1 > .DP1" to=".U2 > .IO1_A" />
    <trace name="USB_C_N" from=".J1 > .DN1" to=".U2 > .IO2_A" />
    <trace from=".J1 > .DP2" to=".J1 > .DP1" />
    <trace from=".J1 > .DN2" to=".J1 > .DN1" />
    {/* no pair declared here: each line also joins the B-side pin (DP2 / DN2), and tscircuit's pairs must be
        single point-to-point connections; these are a few mm of stubs */}
    {net("VBUS", [".U2 > .VBUS"])}
    {net("GND", [".U2 > .GND"])}

    {/* FT2232H */}
    <FT2232HL_REEL name="U1" pcbX={5} pcbY={0} />
    <trace name="USB_P" from=".U2 > .IO1_B" to=".U1 > .DP" />
    <trace name="USB_N" from=".U2 > .IO2_B" to=".U1 > .DM" />
    <differentialpair name="USB_CHIP" positiveConnection="USB_P" negativeConnection="USB_N" maxLengthSkew={0.15} />
    <resistor name="R3" resistance="12k" {...R("C25752")} pcbX={-3} pcbY={2} />
    <trace from=".U1 > .REF" to=".R3 > .pin1" />
    <X322512MSB4SI name="Y1" pcbX={-4.5} pcbY={6.5} loadCapacitance="12pF" />
    <capacitor name="C9" capacitance="18pF" footprint="0402" supplierPartNumbers={{ jlcpcb: ["C1549"] }} pcbX={-7.5}
      pcbY={9} />
    <capacitor name="C10" capacitance="18pF" footprint="0402" supplierPartNumbers={{ jlcpcb: ["C1549"] }} pcbX={-7.5}
      pcbY={4} />
    <trace from=".U1 > .OSCI" to=".Y1 > .pin1" />
    <trace from=".U1 > .OSCO" to=".Y1 > .pin3" />
    <trace from=".Y1 > .pin1" to=".C9 > .pin1" />
    <trace from=".Y1 > .pin3" to=".C10 > .pin1" />
    {net("GND", [".Y1 > .pin2", ".Y1 > .pin4", ".C9 > .pin2", ".C10 > .pin2", ".R3 > .pin2", ".U1 > .TEST",
      ".U1 > .AGND", ...["GND1", "GND2", "GND3", "GND4", "GND5", "GND6", "GND7", "GND8"].map((g) => `.U1 > .${g}`)])}
    {/* 3.3 V into VREGIN / VPHY / VPLL / VCCIO; the internal 1.8 V regulator feeds VCORE */}
    {net("V3V3", [".U1 > .VREGIN", ".U1 > .VPHY", ".U1 > .VPLL", ".U1 > .VCCIO1", ".U1 > .VCCIO2", ".U1 > .VCCIO3",
      ".U1 > .VCCIO4"])}
    {net("V1V8", [".U1 > .VREGOUT", ".U1 > .VCORE1", ".U1 > .VCORE2", ".U1 > .VCORE3"])}
    <resistor name="R4" resistance="10k" {...R("C25744")} pcbX={2} pcbY={10.5} />
    <trace from=".U1 > .N_RESET" to=".R4 > .pin1" />
    {net("V3V3", [".R4 > .pin2"])}
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <capacitor key={`c${i}`} name={`C${i + 1}`} capacitance="100nF" {...C100N} pcbX={-1 + i * 2} pcbY={-14} />
    ))}
    {net("V3V3", [".C1 > .pin1", ".C2 > .pin1", ".C3 > .pin1", ".C4 > .pin1"])}
    {net("V1V8", [".C5 > .pin1", ".C6 > .pin1"])}
    {net("GND", [1, 2, 3, 4, 5, 6].map((n) => `.C${n} > .pin2`))}
    <capacitor name="C7" capacitance="4.7uF" {...C4U7} pcbX={12} pcbY={-14} />
    {net("V1V8", [".C7 > .pin1"])}
    {net("GND", [".C7 > .pin2"])}

    {/* 3.3 V LDO from VBUS */}
    <AP2112K_3_3TRG1 name="U3" pcbX={-10} pcbY={12} />
    <capacitor name="C8" capacitance="4.7uF" {...C4U7} pcbX={-14} pcbY={12} />
    <capacitor name="C11" capacitance="4.7uF" {...C4U7} pcbX={-6} pcbY={12} />
    {net("VBUS", [".U3 > .VIN", ".U3 > .EN", ".C8 > .pin1"])}
    {net("V3V3", [".U3 > .VOUT", ".C11 > .pin1"])}
    {net("GND", [".U3 > .GND", ".C8 > .pin2", ".C11 > .pin2"])}

    {/* channel A FIFO data to a header (stands in for the FPGA) */}
    <pinheader name="J2" pinCount={10} pitch="2.54mm" pcbX={18} pcbY={0} pcbRotation={90} />
    {Array.from({ length: 8 }, (_, i) => (
      <trace key={`d${i}`} name={`FIFO_D${i}`} from={`.U1 > .ADBUS${i}`} to={`.J2 > .pin${i + 1}`} />
    ))}
    {net("GND", [".J2 > .pin9", ".J2 > .pin10"])}
  </board>
)
