// Spike for the logic analyzer, QFP fallback: iCE40HX4K (TQFP-144, 0.5 mm) + SDRAM + 16 inputs on 6 layers,
// the same content as la-bga-spike with the BGA FPGA swapped for a QFP one.
// The imported footprint has pin 1 on its bottom side: rotated -90 deg, IOL/IOB/IOR/IOT are left/bottom/right/top.
// Pins by side (SMU lesson): SDRAM on the right side + the right end of the top side (facing it), inputs on
// the left side (facing the probe header), SPI config to a header.
import { ICE40HX4K_TQ144 } from "./imports/ICE40HX4K_TQ144"
import { W9825G6KH_6 } from "../la-bga-spike/imports/W9825G6KH_6"

const SDRAM_DQ = Array.from({ length: 16 }, (_, i) => `DQ${i}`)
const SDRAM_CTRL = ["LDQM", "UDQM", "CLK", "CKE", "N_CS", "N_RAS", "N_CAS", "N_WE", "BS0", "BS1"]
const SDRAM_ADDR = Array.from({ length: 13 }, (_, i) => `A${i}`)
const SDRAM_SIGNALS = [...SDRAM_DQ, ...SDRAM_CTRL, ...SDRAM_ADDR]
const SDRAM_PINS = ["IOR_48", "IOR_49", "IOR_50", "IOR_51", "IOR_52", "IOR_53", "IOR_54", "IOR_55", "IOR_56",
  "IOR_57", "IOR_58", "IOR_59", "IOR_60_GBIN3", "IOR_61_GBIN2", "IOR_62", "IOR_63", "IOR_64", "IOR_65", "IOR_66",
  "IOR_67", "IOR_68", "IOR_69", "IOR_70", "IOR_71", "IOR_72",
  // the rest split over both corners next to the SDRAM: top-right (IOT start), bottom-right (IOB end)
  "IOT_73", "IOT_74", "IOT_75", "IOT_76", "IOT_77", "IOT_78", "IOT_79",
  "IOB_41", "IOB_40", "IOB_39", "IOB_38", "IOB_37", "IOB_34", "IOB_33"]
const IN_PINS = ["IOL_1A", "IOL_1B", "IOL_2A", "IOL_2B", "IOL_3A", "IOL_3B", "IOL_4A", "IOL_4B", "IOL_5A", "IOL_5B",
  "IOL_8A", "IOL_8B", "IOL_9A", "IOL_9B", "IOL_10A", "IOL_10B"]
const GND_PINS = ["GND1", "GND2", "GND3", "GND4", "GND5", "GND6", "GND7", "GND8", "GND9", "GNDPLL"]
const VCCIO_PINS = ["VCCIO_01", "VCCIO_02", "VCCIO_11", "VCCIO_12", "VCCIO_21", "VCCIO_22", "VCCIO_31", "VCCIO_32",
  "VCC_SPI", "VPP_2V5"]
const VCC_PINS = ["VCC1", "VCC2", "VCC3", "VCC4", "VCCPLL"]

const C100N = { footprint: "0402", supplierPartNumbers: { jlcpcb: ["C1525"] } }
const C10U = { footprint: "0603", supplierPartNumbers: { jlcpcb: ["C19702"] } }

export default () => (
  <board width="70mm" height="50mm" layers={6} minTraceWidth="0.1mm" defaultTraceWidth="0.1mm"
    minTraceToPadEdgeClearance="0.1mm" minViaEdgeToPadEdgeClearance="0.1mm" minViaHoleDiameter="0.2mm"
    minViaPadDiameter="0.4mm" minBoardEdgeClearance="0.5mm" routeRemaining>
    {["top", "inner1", "inner2", "inner4", "bottom"].map((layer) => (
      <copperpour key={layer} layer={layer} connectsTo="net.GND" boardEdgeMargin="0.5mm" />
    ))}
    <copperpour layer="inner3" connectsTo="net.V3V3" boardEdgeMargin="0.5mm" />

    <ICE40HX4K_TQ144 name="U1" pcbX={-10} pcbY={0} pcbRotation={-90} />
    {GND_PINS.map((p) => <trace key={p} from={`.U1 > .${p}`} to="net.GND" />)}
    {VCCIO_PINS.map((p) => <trace key={p} from={`.U1 > .${p}`} to="net.V3V3" />)}
    {VCC_PINS.map((p) => <trace key={p} from={`.U1 > .${p}`} to="net.V1V2" />)}

    {/* decoupling: 1.2 V core (4 + PLL), 3.3 V IO */}
    {[0, 1, 2, 3].map((i) => (
      <capacitor key={`cc${i}`} name={`C${1 + i}`} capacitance="100nF" {...C100N} pcbX={-18 + i * 2.5} pcbY={16} />
    ))}
    <capacitor name="C5" capacitance="10uF" {...C10U} pcbX={-7} pcbY={16} />
    {[1, 2, 3, 4, 5].map((n) => <trace key={`tc${n}`} from={`.C${n} > .pin1`} to="net.V1V2" />)}
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <capacitor key={`cio${i}`} name={`C${6 + i}`} capacitance="100nF" {...C100N} pcbX={-18 + i * 2.5}
        pcbY={-16} />
    ))}
    {[6, 7, 8, 9, 10, 11].map((n) => <trace key={`tio${n}`} from={`.C${n} > .pin1`} to="net.V3V3" />)}
    {Array.from({ length: 11 }, (_, i) => i + 1).map((n) => (
      <trace key={`tg${n}`} from={`.C${n} > .pin2`} to="net.GND" />
    ))}

    {/* SDRAM */}
    <W9825G6KH_6 name="U2" pcbX={20} pcbY={0} />
    {SDRAM_SIGNALS.map((sig, i) => (
      <trace key={sig} name={`SD_${sig}`} from={`.U1 > .${SDRAM_PINS[i]}`} to={`.U2 > .${sig}`} />
    ))}
    {["VDD1", "VDD2", "VDD3", "VDDQ1", "VDDQ2", "VDDQ3", "VDDQ4"].map((p) => (
      <trace key={p} from={`.U2 > .${p}`} to="net.V3V3" />
    ))}
    {["VSS1", "VSS2", "VSS3", "VSSQ1", "VSSQ2", "VSSQ3", "VSSQ4"].map((p) => (
      <trace key={p} from={`.U2 > .${p}`} to="net.GND" />
    ))}
    {[0, 1, 2, 3].map((i) => (
      <capacitor key={`cs${i}`} name={`C${12 + i}`} capacitance="100nF" {...C100N} pcbX={13 + i * 4.5} pcbY={16} />
    ))}
    {[12, 13, 14, 15].map((n) => [
      <trace key={`ts${n}a`} from={`.C${n} > .pin1`} to="net.V3V3" />,
      <trace key={`ts${n}b`} from={`.C${n} > .pin2`} to="net.GND" />,
    ])}

    {/* inputs: 2x10 header, pins 1-16 signals, 17-20 GND */}
    <pinheader name="J1" pinCount={20} doubleRow pitch="2.54mm" pcbX={-30} pcbY={0} pcbRotation={90} />
    {IN_PINS.map((p, i) => <trace key={`in${i}`} name={`IN_${i}`} from={`.U1 > .${p}`} to={`.J1 > .pin${i + 1}`} />)}
    {[17, 18, 19, 20].map((p) => <trace key={`jg${p}`} from={`.J1 > .pin${p}`} to="net.GND" />)}

    {/* SPI config + power entry */}
    <pinheader name="J2" pinCount={8} pitch="2.54mm" pcbX={-8} pcbY={-21.5} />
    {[["IOB_44_SDO", 3], ["IOB_45_SDI", 4], ["IOB_46_SCK", 5], ["IOB_47_SS", 6], ["CDONE", 7], ["CRESET_B", 8]].map(
      ([p, n]) => <trace key={`cfg${p}`} from={`.U1 > .${p}`} to={`.J2 > .pin${n}`} />,
    )}
    <trace from=".J2 > .pin1" to="net.V3V3" />
    <trace from=".J2 > .pin2" to="net.GND" />
    <pinheader name="J3" pinCount={3} pitch="2.54mm" pcbX={20} pcbY={-20} />
    <trace from=".J3 > .pin1" to="net.GND" />
    <trace from=".J3 > .pin2" to="net.V3V3" />
    <trace from=".J3 > .pin3" to="net.V1V2" />
  </board>
)
