import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["VCCA"],
  pin2: ["DIR"],
  pin3: ["A1"],
  pin4: ["A2"],
  pin5: ["A3"],
  pin6: ["A4"],
  pin7: ["A5"],
  pin8: ["A6"],
  pin9: ["A7"],
  pin10: ["A8"],
  pin11: ["GND2"],
  pin12: ["GND1"],
  pin13: ["GND3"],
  pin14: ["B8"],
  pin15: ["B7"],
  pin16: ["B6"],
  pin17: ["B5"],
  pin18: ["B4"],
  pin19: ["B3"],
  pin20: ["B2"],
  pin21: ["B1"],
  pin22: ["N_OE"],
  pin23: ["VCCB1"],
  pin24: ["VCCB2"]
} as const

const pinAttributes = {
  pin11: {requiresGround: true},
  pin12: {requiresGround: true},
  pin13: {requiresGround: true}
} as const

export const SN74LVC8T245PWR = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      pinAttributes={pinAttributes}
      supplierPartNumbers={{
  "jlcpcb": [
    "C27643"
  ]
}}
      manufacturerPartNumber="SN74LVC8T245PWR"
      footprint="tssop24_p0.65mm_w4.3952mm_pw0.4mm_pl1.65mm_rounded0mm_pin1location(leftside,bottom)"
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C27643.obj?uuid=4564b07290534b8ea1373eede2664361",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C27643.step?uuid=4564b07290534b8ea1373eede2664361",
        pcbRotationOffset: 90,
        modelOriginPosition: { x: 0, y: 0, z: -0.019205 },
      }}
      {...props}
    />
  )
}