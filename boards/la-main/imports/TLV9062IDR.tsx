import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["OUT1"],
  pin2: ["IN1_N"],
  pin3: ["IN1_P"],
  pin4: ["VNEG"],
  pin5: ["IN2_P"],
  pin6: ["IN2_N"],
  pin7: ["OUT2"],
  pin8: ["VPOS"]
} as const

export const TLV9062IDR = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      supplierPartNumbers={{
  "jlcpcb": [
    "C398355"
  ]
}}
      manufacturerPartNumber="TLV9062IDR"
      footprint="soic8_pillpads_w7.36mm_pw0.57mm_pl1.95mm_pin1location(leftside,bottom)"
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C398355.obj?uuid=7abc64c95a1a4a04a4ef38f9097c870b",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C398355.step?uuid=7abc64c95a1a4a04a4ef38f9097c870b",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0.000012700000070253736, y: 0, z: 0 },
      }}
      {...props}
    />
  )
}