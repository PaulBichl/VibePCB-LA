import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["GND8"],
  pin2: ["OSCI"],
  pin3: ["OSCO"],
  pin4: ["VPHY"],
  pin5: ["GND7"],
  pin6: ["REF"],
  pin7: ["DM"],
  pin8: ["DP"],
  pin9: ["VPLL"],
  pin10: ["AGND"],
  pin11: ["GND6"],
  pin12: ["VCORE3"],
  pin13: ["TEST"],
  pin14: ["N_RESET"],
  pin15: ["GND5"],
  pin16: ["ADBUS0"],
  pin17: ["ADBUS1"],
  pin18: ["ADBUS2"],
  pin19: ["ADBUS3"],
  pin20: ["VCCIO4"],
  pin21: ["ADBUS4"],
  pin22: ["ADBUS5"],
  pin23: ["ADBUS6"],
  pin24: ["ADBUS7"],
  pin25: ["GND4"],
  pin26: ["ACBUS0"],
  pin27: ["ACBUS1"],
  pin28: ["ACBUS2"],
  pin29: ["ACBUS3"],
  pin30: ["ACBUS4"],
  pin31: ["VCCIO3"],
  pin32: ["ACBUS5"],
  pin33: ["ACBUS6"],
  pin34: ["ACBUS7"],
  pin35: ["GND3"],
  pin36: ["N_SUSPEND"],
  pin37: ["VCORE2"],
  pin38: ["BDBUS0"],
  pin39: ["BDBUS1"],
  pin40: ["BDBUS2"],
  pin41: ["BDBUS3"],
  pin42: ["VCCIO2"],
  pin43: ["BDBUS4"],
  pin44: ["BDBUS5"],
  pin45: ["BDBUS6"],
  pin46: ["BDBUS7"],
  pin47: ["GND2"],
  pin48: ["BCBUS0"],
  pin49: ["VREGOUT"],
  pin50: ["VREGIN"],
  pin51: ["GND1"],
  pin52: ["BCBUS1"],
  pin53: ["BCBUS2"],
  pin54: ["BCBUS3"],
  pin55: ["BCBUS4"],
  pin56: ["VCCIO1"],
  pin57: ["BCBUS5"],
  pin58: ["BCBUS6"],
  pin59: ["BCBUS7"],
  pin60: ["N_PWREN"],
  pin61: ["EEDATA"],
  pin62: ["EECLK"],
  pin63: ["EECS"],
  pin64: ["VCORE1"]
} as const

const pinAttributes = {
  pin1: {requiresGround: true},
  pin5: {requiresGround: true},
  pin10: {requiresGround: true},
  pin11: {requiresGround: true},
  pin15: {requiresGround: true},
  pin25: {requiresGround: true},
  pin35: {requiresGround: true},
  pin47: {requiresGround: true},
  pin51: {requiresGround: true}
} as const

export const FT2232HL_REEL = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      pinAttributes={pinAttributes}
      supplierPartNumbers={{
  "jlcpcb": [
    "C27882"
  ]
}}
      manufacturerPartNumber="FT2232HL-REEL"
      footprint="lga64_grid16x16_pillpads_w12.9mm_h12.9mm_pl1.8mm"
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C27882.obj?uuid=7e9b9111dcfd48d3add0eab11d882721",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C27882.step?uuid=7e9b9111dcfd48d3add0eab11d882721",
        pcbRotationOffset: 270,
        modelOriginPosition: { x: 0, y: 0, z: 0.000795 },
      }}
      {...props}
    />
  )
}