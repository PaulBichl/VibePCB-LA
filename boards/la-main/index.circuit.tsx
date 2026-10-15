// VibePCB logic analyzer: 16 channels, 100 MSa/s into 32 MB SDRAM, read out over USB 2.0 HS.
// 98 x 64 mm, 4 layers (top signals + GND / In1 GND / In2 3V3 plane / bottom signals + GND).
//
// - Inputs: 2x10 header (16 signals + GND) -> 1k + SRV05-4 clamps to the bank rail / GND, 1M pull-down ->
//   74LVC8T245 (A side on the bank rail VIO_A / VIO_B, B side 3.3 V) -> FPGA left side.
//   Bank rail = FPGA PWM -> 10k/1uF -> TLV9062 (gain 1.5): 1.2..4.95 V, threshold ~ rail / 2.
// - FPGA: iCE40HX4K TQFP-144 (rotated -90 deg: the imported footprint has pin 1 on its bottom side, so
//   IOL/IOB/IOR/IOT end up left/bottom/right/top). 100 MHz oscillator into a global clock input.
//   Pins by side: inputs left, SDRAM right (+ both right corners), FT2232H FIFO top, config / PWM / LEDs bottom.
// - SDRAM: W9825G6KH (16-bit, 32 MB), length groups in vibepcb.toml (timing budget).
// - USB: USB-C (5 V, 5.1k CC) -> USBLC6 ESD -> FT2232H (A: 245 sync FIFO to the FPGA, B: MPSSE programs
//   the SPI flash). 93LC56 EEPROM holds the FIFO mode setting; 12 MHz crystal.
// - Power: 5 V -> TLV62569 3.3 V and 1.2 V (core). < 2.5 W.
import { A_93LC56BT_I_OT } from "./imports/A_93LC56BT_I_OT"
import { FT2232HL_REEL } from "./imports/FT2232HL_REEL"
import { ICE40HX4K_TQ144 } from "./imports/ICE40HX4K_TQ144"
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
import { W9825G6KH_6 } from "./imports/W9825G6KH_6"
import { X322512MSB4SI } from "./imports/X322512MSB4SI"

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
const SDRAM_DQ = Array.from({ length: 16 }, (_, i) => `DQ${i}`)
const SDRAM_CA = ["LDQM", "UDQM", "CLK", "CKE", "N_CS", "N_RAS", "N_CAS", "N_WE", "BS0", "BS1",
  ...Array.from({ length: 13 }, (_, i) => `A${i}`)]
// paired with the SDRAM signals by position (both pin rows walked in the same order): the bus doesn't cross itself
const SDRAM_PINS = ["IOB_41", "IOB_39", "IOB_37", "IOB_33", "IOR_49", "IOR_51", "IOR_53", "IOR_55", "IOR_56",
  "IOR_54", "IOR_52", "IOR_50", "IOR_48", "IOB_34", "IOB_38", "IOB_40", "IOR_57", "IOR_59", "IOR_61_GBIN2",
  "IOR_63", "IOR_64", "IOR_62", "IOR_60_GBIN3", "IOR_58", "IOR_66", "IOR_68", "IOR_72", "IOT_74", "IOT_76",
  "IOT_78", "IOT_79", "IOT_77", "IOT_75", "IOT_73", "IOR_71", "IOR_69", "IOR_70", "IOR_67", "IOR_65"]
const IN_PINS = ["IOL_1A", "IOL_1B", "IOL_2A", "IOL_2B", "IOL_3A", "IOL_3B", "IOL_4A", "IOL_4B", "IOL_5A", "IOL_5B",
  "IOL_8A", "IOL_8B", "IOL_9A", "IOL_9B", "IOL_10A", "IOL_10B"]
// FT2232H channel A, 245 synchronous FIFO: data + control on the top side, CLKOUT (60 MHz) on a global input
const FIFO = [
  ["ADBUS0", "IOT_96"], ["ADBUS1", "IOT_95"], ["ADBUS2", "IOT_94"], ["ADBUS3", "IOT_93"], ["ADBUS4", "IOT_92"],
  ["ADBUS5", "IOT_91"], ["ADBUS6", "IOT_90"], ["ADBUS7", "IOT_89"], ["ACBUS0", "IOT_88"], ["ACBUS1", "IOT_87"],
  ["ACBUS2", "IOT_83"], ["ACBUS3", "IOT_82"], ["ACBUS4", "IOT_81"], ["ACBUS5", "IOT_84_GBIN1"], ["ACBUS6", "IOT_80"],
] as const
const FIFO_NAMES: Record<string, string> = {
  ACBUS0: "FT_RXF_N", ACBUS1: "FT_TXE_N", ACBUS2: "FT_RD_N", ACBUS3: "FT_WR_N", ACBUS4: "FT_SIWU",
  ACBUS5: "FT_CLKOUT", ACBUS6: "FT_OE_N",
}

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

const GND_PINS = ["GND1", "GND2", "GND3", "GND4", "GND5", "GND6", "GND7", "GND8", "GND9", "GNDPLL"]
const V3V3_PINS = ["VCCIO_01", "VCCIO_02", "VCCIO_11", "VCCIO_12", "VCCIO_21", "VCCIO_22", "VCCIO_31", "VCCIO_32",
  "VCC_SPI", "VPP_2V5"]
const V1V2_PINS = ["VCC1", "VCC2", "VCC3", "VCC4"]

export default () => (
  <board outline={[{ x: -53, y: 32 }, { x: 45, y: 32 }, { x: 45, y: -32 }, { x: -53, y: -32 }]} layers={4} minTraceWidth="0.1mm" defaultTraceWidth="0.15mm"
    minTraceToPadEdgeClearance="0.1mm" minViaEdgeToPadEdgeClearance="0.1mm" minViaHoleDiameter="0.2mm"
    minViaPadDiameter="0.4mm" minBoardEdgeClearance="0.5mm" routeRemaining>
    {["top", "inner1", "bottom"].map((layer) => (
      <copperpour key={layer} layer={layer} connectsTo="net.GND" boardEdgeMargin="0.5mm" />
    ))}
    <copperpour layer="inner2" connectsTo="net.V3V3" boardEdgeMargin="0.5mm" />

    {/* ======================== FPGA ======================== */}
    <ICE40HX4K_TQ144 name="U1" pcbX={-2} pcbY={-2} pcbRotation={-90} />
    {net("GND", GND_PINS.map((p) => `.U1 > .${p}`))}
    {net("V3V3", V3V3_PINS.map((p) => `.U1 > .${p}`))}
    {net("V1V2", V1V2_PINS.map((p) => `.U1 > .${p}`))}
    {/* VCCPLL: 1.2 V through 100R, its own 10uF + 100nF (iCE40 hardware checklist) */}
    <R name="R40" v="100" pcbX={-8} pcbY={-16} />
    <trace from=".U1 > .VCCPLL" to=".R40 > .pin2" />
    {net("V1V2", [".R40 > .pin1"])}
    <C name="C40" v="10uF" pcbX={-11} pcbY={-16} />
    <C name="C41" v="100nF" pcbX={-13.5} pcbY={-16} />
    {net("V1V2_PLL", [".R40 > .pin2", ".C40 > .pin1", ".C41 > .pin1"])}
    {/* decoupling: 1.2 V core x4 + bulk, 3.3 V IO x6 + bulk */}
    {[0, 1, 2, 3].map((i) => <C key={`cv${i}`} name={`C${1 + i}`} v="100nF" pcbX={-15 + i * 2} pcbY={12} />)}
    <C name="C5" v="10uF" pcbX={-6} pcbY={12} />
    {net("V1V2", [1, 2, 3, 4, 5].map((n) => `.C${n} > .pin1`))}
    {[0, 1, 2, 3, 4, 5].map((i) => <C key={`ci${i}`} name={`C${6 + i}`} v="100nF" pcbX={2 + i * 2} pcbY={12} />)}
    <C name="C12" v="10uF" pcbX={15.5} pcbY={12} />
    {net("V3V3", [6, 7, 8, 9, 10, 11, 12].map((n) => `.C${n} > .pin1`))}
    {net("GND", [...Array.from({ length: 12 }, (_, i) => `.C${i + 1} > .pin2`), ".C40 > .pin2", ".C41 > .pin2"])}
    {/* 100 MHz sample clock into a global input on the left side */}
    <SX3M100_000B20F30TNN name="Y2" pcbX={-10} pcbY={-21} />
    <C name="C13" v="100nF" pcbX={-10} pcbY={-24.5} />
    <trace name="CLK100" from=".Y2 > .OUT" to=".U1 > .IOL_7A_GBIN6" />
    {net("V3V3", [".Y2 > .VDD", ".Y2 > .TRI_STATE", ".C13 > .pin1"])}
    {net("GND", [".Y2 > .GND", ".C13 > .pin2"])}

    {/* ======================== SDRAM ======================== */}
    <W9825G6KH_6 name="U2" pcbX={24} pcbY={-2} pcbRotation={90} />
    {[...SDRAM_DQ, ...SDRAM_CA].map((sig, i) => (
      <trace key={sig} name={`SD_${sig}`} from={`.U1 > .${SDRAM_PINS[i]}`} to={`.U2 > .${sig}`} />
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
    <USBLC6_2SC6 name="U4" pcbX={-15} pcbY={24} pcbRotation={90} />
    <trace name="USB_C_P" from=".J2 > .DP1" to=".U4 > .IO1_A" />
    <trace name="USB_C_N" from=".J2 > .DN1" to=".U4 > .IO2_A" />
    <trace from=".J2 > .DP2" to=".J2 > .DP1" />
    <trace from=".J2 > .DN2" to=".J2 > .DN1" />
    {net("V5", [".U4 > .VBUS"])}
    {net("GND", [".U4 > .GND"])}
    <FT2232HL_REEL name="U3" pcbX={2} pcbY={22} />
    <trace name="USB_P" from=".U4 > .IO1_B" to=".U3 > .DP" />
    <trace name="USB_N" from=".U4 > .IO2_B" to=".U3 > .DM" />
    <differentialpair name="USB" positiveConnection="USB_P" negativeConnection="USB_N" maxLengthSkew={0.15} />
    {FIFO.map(([ft, fpga]) => (
      <trace key={ft} name={FIFO_NAMES[ft] ?? `FT_D${ft.slice(-1)}`} from={`.U3 > .${ft}`} to={`.U1 > .${fpga}`} />
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

    {/* ======================== config: SPI flash, FT2232H B programs it ======================== */}
    <W25Q128JVSIQ name="U9" pcbX={12} pcbY={-21} />
    <trace name="SPI_SCK" from=".U1 > .IOB_46_SCK" to=".U9 > .CLK" />
    <trace name="SPI_SS_N" from=".U1 > .IOB_47_SS" to=".U9 > .N_CS" />
    <trace name="SPI_COPI" from=".U1 > .IOB_44_SDO" to=".U9 > .DI" />
    <trace name="SPI_CIPO" from=".U1 > .IOB_45_SDI" to=".U9 > .DO" />
    {net("SPI_SCK", [".U3 > .BDBUS0"])}
    {net("SPI_COPI", [".U3 > .BDBUS1"])}
    {net("SPI_CIPO", [".U3 > .BDBUS2"])}
    {net("SPI_SS_N", [".U3 > .BDBUS4"])}
    {net("FPGA_CDONE", [".U1 > .CDONE", ".U3 > .BDBUS6"])}
    {net("FPGA_CRESET_N", [".U1 > .CRESET_B", ".U3 > .BDBUS7"])}
    {[["R6", "SPI_SS_N"], ["R7", "FPGA_CDONE"], ["R8", "FPGA_CRESET_N"]].map(([r, n], i) => [
      <R key={r} name={r} v="10k" pcbX={18 + i * 2} pcbY={-17} pcbRotation={90} />,
      ...net(n, [`.${r} > .pin1`]),
      ...net("V3V3", [`.${r} > .pin2`]),
    ])}
    {net("V3V3", [".U9 > .VCC", ".U9 > .IO2", ".U9 > .IO3"])}
    {net("GND", [".U9 > .GND"])}
    <C name="C25" v="100nF" pcbX={12} pcbY={-28} />
    {net("V3V3", [".C25 > .pin1"])}
    {net("GND", [".C25 > .pin2"])}

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
            <trace key={`tb${ch}`} name={`CH${ch}`} from={`.${u} > .B${(ch % 8) + 1}`} to={`.U1 > .${IN_PINS[ch]}`} />,
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
    {[["A", "1", "IOB_24", -0], ["B", "2", "IOB_25", 1]].map(([bank, n, pin, i]) => {
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

    {/* ======================== power: 5 V -> 3.3 V, 1.2 V ======================== */}
    {[["U10", "V3V3", "22k", 24, 0], ["U11", "V1V2", "100k", 16, 1]].map(([u, rail, rbot, y, i]) => {
      const n = 60 + Number(i) * 10
      return [
        <TLV62569DBVR key={u} name={String(u)} pcbX={30} pcbY={Number(y)} />,
        <inductor key={`l${u}`} name={`L${1 + Number(i)}`} inductance="2.2uH" footprint="0805"
          supplierPartNumbers={{ jlcpcb: ["C63167"] }} pcbX={35.5} pcbY={Number(y)} pcbRotation={90} />,
        <C key={`ci${u}`} name={`C${n}`} v="10uF" pcbX={26} pcbY={Number(y)} pcbRotation={90} />,
        <C key={`co${u}`} name={`C${n + 1}`} v="22uF" pcbX={39} pcbY={Number(y)} pcbRotation={90} />,
        <R key={`rt${u}`} name={`R${n}`} v="100k" pcbX={30} pcbY={Number(y) - 3} />,
        <R key={`rb${u}`} name={`R${n + 1}`} v={String(rbot)} pcbX={33} pcbY={Number(y) - 3} />,
        ...net("V5", [`.${u} > .VIN`, `.${u} > .EN`, `.C${n} > .pin1`]),
        ...net(`SW_${rail}`, [`.${u} > .SW`, `.L${1 + Number(i)} > .pin1`]),
        ...net(String(rail), [`.L${1 + Number(i)} > .pin2`, `.C${n + 1} > .pin1`, `.R${n} > .pin1`]),
        ...net(`FB_${rail}`, [`.${u} > .FB`, `.R${n} > .pin2`, `.R${n + 1} > .pin1`]),
        ...net("GND", [`.${u} > .GND`, `.C${n} > .pin2`, `.C${n + 1} > .pin2`, `.R${n + 1} > .pin2`]),
      ]
    })}

    {/* ======================== silkscreen ======================== */}
    <silkscreentext text="VibePCB LA16 rev 1  16 ch / 100 MSa/s" pcbX={6} pcbY={-30} fontSize="1.2mm" />
    <silkscreentext text="USB-C 5V" pcbX={-26} pcbY={20.5} fontSize="1mm" />
    {["PWR", "ACT", "TRIG"].map((t, i) => (
      <silkscreentext key={t} text={t} pcbX={32 + i * 3} pcbY={-29.5} fontSize="0.8mm" />
    ))}

    {/* ======================== LEDs ======================== */}
    {[["D20", "V3V3", null], ["D21", "LED_ACT", "IOB_26"], ["D22", "LED_TRIG", "IOB_27"]].map(([d, n, pin], i) => [
      <KT_0603G key={String(d)} name={String(d)} pcbX={32 + i * 3} pcbY={-27} />,
      <R key={`r${d}`} name={`R${80 + i}`} v="330" pcbX={32 + i * 3} pcbY={-24} pcbRotation={90} />,
      ...(pin ? [<trace key={`tl${d}`} name={String(n)} from={`.U1 > .${pin}`} to={`.R${80 + i} > .pin2`} />]
        : net("V3V3", [`.R${80 + i} > .pin2`])),
      <trace key={`ta${d}`} from={`.R${80 + i} > .pin1`} to={`.${d} > .anode`} />,
      ...net("GND", [`.${d} > .cathode`]),
    ])}
  </board>
)
