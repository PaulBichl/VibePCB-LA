import type { ChipProps } from "@tscircuit/props"

// labels from the JEDEC 54-ball x16 SDRAM ballout (EasyEDA's were ambiguous: A1/A11, ball/address clashes),
// named like the W9825G6KH import so the same traces apply; pad positions checked against the balls
const pinLabels = {
  pin1: ["A1"],
  pin2: ["A0"],
  pin3: ["A2"],
  pin4: ["A6"],
  pin5: ["A7"],
  pin6: ["A8"],
  pin7: ["BS1"],
  pin8: ["BS0"],
  pin9: ["A3"],
  pin10: ["A9"],
  pin11: ["A11"],
  pin12: ["A12"],
  pin13: ["N_RAS"],
  pin14: ["N_CAS"],
  pin15: ["CKE"],
  pin16: ["CLK"],
  pin17: ["UDQM"],
  pin18: ["LDQM"],
  pin19: ["VDD1"],
  pin20: ["VSS1"],
  pin21: ["NC"],
  pin22: ["DQ8"],
  pin23: ["DQ6"],
  pin24: ["VSSQ1"],
  pin25: ["VDDQ1"],
  pin26: ["DQ9"],
  pin27: ["DQ10"],
  pin28: ["DQ4"],
  pin29: ["VDDQ2"],
  pin30: ["A4"],
  pin31: ["VSSQ2"],
  pin32: ["DQ11"],
  pin33: ["DQ12"],
  pin34: ["DQ2"],
  pin35: ["VSSQ3"],
  pin36: ["A5"],
  pin37: ["VDDQ3"],
  pin38: ["DQ13"],
  pin39: ["DQ14"],
  pin40: ["DQ0"],
  pin41: ["VDDQ4"],
  pin42: ["VSS2"],
  pin43: ["VSSQ4"],
  pin44: ["DQ15"],
  pin45: ["VSS3"],
  pin46: ["A10", "AP"],
  pin47: ["VDD2"],
  pin48: ["N_CS"],
  pin49: ["N_WE"],
  pin50: ["DQ7"],
  pin51: ["DQ5"],
  pin52: ["DQ3"],
  pin53: ["DQ1"],
  pin54: ["VDD3"]
} as const

export const IS42S16160J_7BLI = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      supplierPartNumbers={{
  "jlcpcb": [
    "C1348766"
  ]
}}
      manufacturerPartNumber="IS42S16160J-7BLI"
      footprint={<footprint>
        <smtpad portHints={["pin1"]} pcbX="2.399919mm" pcbY="-2.399919mm" radius="0.1799971mm" shape="circle" />
<smtpad portHints={["pin2"]} pcbX="1.600073mm" pcbY="-2.399919mm" radius="0.1799971mm" shape="circle" />
<smtpad portHints={["pin3"]} pcbX="2.399919mm" pcbY="-3.200019mm" radius="0.1799971mm" shape="circle" />
<smtpad portHints={["pin4"]} pcbX="-1.600073mm" pcbY="-2.399919mm" radius="0.1799971mm" shape="circle" />
<smtpad portHints={["pin5"]} pcbX="-2.399919mm" pcbY="-2.399919mm" radius="0.1799971mm" shape="circle" />
<smtpad portHints={["pin6"]} pcbX="-3.200019mm" pcbY="-2.399919mm" radius="0.1799971mm" shape="circle" />
<smtpad portHints={["pin7"]} pcbX="2.399919mm" pcbY="-1.600073mm" radius="0.1799971mm" shape="circle" />
<smtpad portHints={["pin8"]} pcbX="1.600073mm" pcbY="-1.600073mm" radius="0.1799971mm" shape="circle" />
<smtpad portHints={["pin9"]} pcbX="1.600073mm" pcbY="-3.200019mm" radius="0.1799971mm" shape="circle" />
<smtpad portHints={["pin10"]} pcbX="-1.600073mm" pcbY="-1.600073mm" radius="0.1799971mm" shape="circle" />
<smtpad portHints={["pin11"]} pcbX="-2.399919mm" pcbY="-1.600073mm" radius="0.1799971mm" shape="circle" />
<smtpad portHints={["pin12"]} pcbX="-3.200019mm" pcbY="-1.600073mm" radius="0.1799971mm" shape="circle" />
<smtpad portHints={["pin13"]} pcbX="2.399919mm" pcbY="-0.799973mm" radius="0.1799971mm" shape="circle" />
<smtpad portHints={["pin14"]} pcbX="1.600073mm" pcbY="-0.799973mm" radius="0.1799971mm" shape="circle" />
<smtpad portHints={["pin15"]} pcbX="-1.600073mm" pcbY="-0.799973mm" radius="0.1799971mm" shape="circle" />
<smtpad portHints={["pin16"]} pcbX="-2.399919mm" pcbY="-0.799973mm" radius="0.1799971mm" shape="circle" />
<smtpad portHints={["pin17"]} pcbX="-3.200019mm" pcbY="-0.799973mm" radius="0.1799971mm" shape="circle" />
<smtpad portHints={["pin18"]} pcbX="2.399919mm" pcbY="0.000127mm" radius="0.1799971mm" shape="circle" />
<smtpad portHints={["pin19"]} pcbX="1.600073mm" pcbY="0.000127mm" radius="0.1799971mm" shape="circle" />
<smtpad portHints={["pin20"]} pcbX="-1.600073mm" pcbY="0.000127mm" radius="0.1799971mm" shape="circle" />
<smtpad portHints={["pin21"]} pcbX="-2.399919mm" pcbY="0.000127mm" radius="0.1799971mm" shape="circle" />
<smtpad portHints={["pin22"]} pcbX="-3.200019mm" pcbY="0.000127mm" radius="0.1799971mm" shape="circle" />
<smtpad portHints={["pin23"]} pcbX="2.399919mm" pcbY="0.799973mm" radius="0.1799971mm" shape="circle" />
<smtpad portHints={["pin24"]} pcbX="1.600073mm" pcbY="0.799973mm" radius="0.1799971mm" shape="circle" />
<smtpad portHints={["pin25"]} pcbX="-1.600073mm" pcbY="0.799973mm" radius="0.1799971mm" shape="circle" />
<smtpad portHints={["pin26"]} pcbX="-2.399919mm" pcbY="0.799973mm" radius="0.1799971mm" shape="circle" />
<smtpad portHints={["pin27"]} pcbX="-3.200019mm" pcbY="0.799973mm" radius="0.1799971mm" shape="circle" />
<smtpad portHints={["pin28"]} pcbX="2.399919mm" pcbY="1.600073mm" radius="0.1799971mm" shape="circle" />
<smtpad portHints={["pin29"]} pcbX="1.600073mm" pcbY="1.600073mm" radius="0.1799971mm" shape="circle" />
<smtpad portHints={["pin30"]} pcbX="-1.600073mm" pcbY="-3.200019mm" radius="0.1799971mm" shape="circle" />
<smtpad portHints={["pin31"]} pcbX="-1.600073mm" pcbY="1.600073mm" radius="0.1799971mm" shape="circle" />
<smtpad portHints={["pin32"]} pcbX="-2.399919mm" pcbY="1.600073mm" radius="0.1799971mm" shape="circle" />
<smtpad portHints={["pin33"]} pcbX="-3.200019mm" pcbY="1.600073mm" radius="0.1799971mm" shape="circle" />
<smtpad portHints={["pin34"]} pcbX="2.399919mm" pcbY="2.399919mm" radius="0.1799971mm" shape="circle" />
<smtpad portHints={["pin35"]} pcbX="1.600073mm" pcbY="2.399919mm" radius="0.1799971mm" shape="circle" />
<smtpad portHints={["pin36"]} pcbX="-2.399919mm" pcbY="-3.200019mm" radius="0.1799971mm" shape="circle" />
<smtpad portHints={["pin37"]} pcbX="-1.600073mm" pcbY="2.399919mm" radius="0.1799971mm" shape="circle" />
<smtpad portHints={["pin38"]} pcbX="-2.399919mm" pcbY="2.399919mm" radius="0.1799971mm" shape="circle" />
<smtpad portHints={["pin39"]} pcbX="-3.200019mm" pcbY="2.399919mm" radius="0.1799971mm" shape="circle" />
<smtpad portHints={["pin40"]} pcbX="2.399919mm" pcbY="3.200019mm" radius="0.1799971mm" shape="circle" />
<smtpad portHints={["pin41"]} pcbX="1.600073mm" pcbY="3.200019mm" radius="0.1799971mm" shape="circle" />
<smtpad portHints={["pin42"]} pcbX="-3.200019mm" pcbY="-3.200019mm" radius="0.1799971mm" shape="circle" />
<smtpad portHints={["pin43"]} pcbX="-1.600073mm" pcbY="3.200019mm" radius="0.1799971mm" shape="circle" />
<smtpad portHints={["pin44"]} pcbX="-2.399919mm" pcbY="3.200019mm" radius="0.1799971mm" shape="circle" />
<smtpad portHints={["pin45"]} pcbX="-3.200019mm" pcbY="3.200019mm" radius="0.1799971mm" shape="circle" />
<smtpad portHints={["pin46"]} pcbX="3.200019mm" pcbY="-2.399919mm" radius="0.1799971mm" shape="circle" />
<smtpad portHints={["pin47"]} pcbX="3.200019mm" pcbY="-3.200019mm" radius="0.1799971mm" shape="circle" />
<smtpad portHints={["pin48"]} pcbX="3.200019mm" pcbY="-1.600073mm" radius="0.1799971mm" shape="circle" />
<smtpad portHints={["pin49"]} pcbX="3.200019mm" pcbY="-0.799973mm" radius="0.1799971mm" shape="circle" />
<smtpad portHints={["pin50"]} pcbX="3.200019mm" pcbY="0.000127mm" radius="0.1799971mm" shape="circle" />
<smtpad portHints={["pin51"]} pcbX="3.200019mm" pcbY="0.799973mm" radius="0.1799971mm" shape="circle" />
<smtpad portHints={["pin52"]} pcbX="3.200019mm" pcbY="1.600073mm" radius="0.1799971mm" shape="circle" />
<smtpad portHints={["pin53"]} pcbX="3.200019mm" pcbY="2.399919mm" radius="0.1799971mm" shape="circle" />
<smtpad portHints={["pin54"]} pcbX="3.200019mm" pcbY="3.200019mm" radius="0.1799971mm" shape="circle" />
<silkscreenpath route={[{"x":-3.9999919999999918,"y":3.999992000000006},{"x":3.99999200000002,"y":3.999992000000006},{"x":3.99999200000002,"y":-3.9999919999999918},{"x":-3.9999919999999918,"y":-3.9999919999999918},{"x":-3.9999919999999918,"y":3.999992000000006}]} />
<silkscreenpath route={[{"x":-3.382797399999987,"y":3.999992000000006},{"x":-3.4442146000000093,"y":3.999992000000006},{"x":-3.9999919999999918,"y":3.4442146000000022}]} />
<silkscreenpath route={[{"x":-3.6702238000000023,"y":3.999992000000006},{"x":-3.6702238000000023,"y":3.974515800000006},{"x":-3.9999919999999918,"y":3.6447476000000094}]} />
<silkscreenpath route={[{"x":-4.318000000000012,"y":3.3020000000000067},{"x":-4.443629576479964,"y":3.4257294070611337},{"x":-4.567995588286152,"y":3.3007300000000015},{"x":-4.443629576479964,"y":3.1757305929388764},{"x":-4.318000000000012,"y":3.2994600000000034}]} />
<silkscreentext text="{NAME}" pcbX="-0.291719mm" pcbY="5.038219mm" anchorAlignment="center" fontSize="1mm" />
<courtyardoutline outline={[{"x":-4.249991999999992,"y":4.249992000000006},{"x":4.24999200000002,"y":4.249992000000006},{"x":4.24999200000002,"y":-4.249991999999992},{"x":-4.249991999999992,"y":-4.249991999999992},{"x":-4.249991999999992,"y":4.249992000000006}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C1348766.obj?uuid=73b8c95875e444afa68644009fc83004",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C1348766.step?uuid=73b8c95875e444afa68644009fc83004",
        pcbRotationOffset: 270,
        modelOriginPosition: { x: 0, y: 0, z: 0.09999979999999999 },
      }}
      {...props}
    />
  )
}