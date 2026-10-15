import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["VDD1"],
  pin2: ["DQ0"],
  pin3: ["VDDQ1"],
  pin4: ["DQ1"],
  pin5: ["DQ2"],
  pin6: ["VSSQ1"],
  pin7: ["DQ3"],
  pin8: ["DQ4"],
  pin9: ["VDDQ2"],
  pin10: ["DQ5"],
  pin11: ["DQ6"],
  pin12: ["VSSQ2"],
  pin13: ["DQ7"],
  pin14: ["VDD2"],
  pin15: ["LDQM"],
  pin16: ["N_WE"],
  pin17: ["N_CAS"],
  pin18: ["N_RAS"],
  pin19: ["N_CS"],
  pin20: ["BS0"],
  pin21: ["BS1"],
  pin22: ["A10","AP"],
  pin23: ["A0"],
  pin24: ["A1"],
  pin25: ["A2"],
  pin26: ["A3"],
  pin27: ["VDD3"],
  pin28: ["VSS3"],
  pin29: ["A4"],
  pin30: ["A5"],
  pin31: ["A6"],
  pin32: ["A7"],
  pin33: ["A8"],
  pin34: ["A9"],
  pin35: ["A11"],
  pin36: ["A12"],
  pin37: ["CKE"],
  pin38: ["CLK"],
  pin39: ["UDQM"],
  pin40: ["NC"],
  pin41: ["VSS2"],
  pin42: ["DQ8"],
  pin43: ["VDDQ4"],
  pin44: ["DQ9"],
  pin45: ["DQ10"],
  pin46: ["VSSQ4"],
  pin47: ["DQ11"],
  pin48: ["DQ12"],
  pin49: ["VDDQ3"],
  pin50: ["DQ13"],
  pin51: ["DQ14"],
  pin52: ["VSSQ3"],
  pin53: ["DQ15"],
  pin54: ["VSS1"]
} as const

const pinAttributes = {
  pin1: {requiresPower: true},
  pin14: {requiresPower: true},
  pin27: {requiresPower: true},
  pin28: {requiresGround: true},
  pin40: {doNotConnect: true},
  pin41: {requiresGround: true},
  pin54: {requiresGround: true}
} as const

export const W9825G6KH_6 = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      pinAttributes={pinAttributes}
      supplierPartNumbers={{
  "jlcpcb": [
    "C62246"
  ]
}}
      manufacturerPartNumber="W9825G6KH-6"
      footprint="dfn54_pillpads_p0.8mm_w13.08mm_pw0.5mm_pl1.8mm_pin1location(leftside,bottom)"
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C62246.obj?uuid=a6c566f0b4a6425ca3588e19cedc08b0",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C62246.step?uuid=a6c566f0b4a6425ca3588e19cedc08b0",
        pcbRotationOffset: 90,
        modelOriginPosition: { x: 0.000012699999956566899, y: 0, z: 0.000917 },
      }}
      {...props}
    />
  )
}