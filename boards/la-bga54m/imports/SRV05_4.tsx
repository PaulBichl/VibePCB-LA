import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["IO1"],
  pin2: ["GND"],
  pin3: ["IO2"],
  pin4: ["IO3"],
  pin5: ["VDD"],
  pin6: ["IO4"]
} as const

export const SRV05_4 = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      supplierPartNumbers={{
  "jlcpcb": [
    "C2836319"
  ]
}}
      manufacturerPartNumber="SRV05-4"
      footprint="dfn6_p0.95mm_w3.3702mm_pw0.532mm_pl1.072mm_pin1location(leftside,bottom)"
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C2836319.obj?uuid=229b69761e2c45dba6a83d8866dec72d",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C2836319.step?uuid=229b69761e2c45dba6a83d8866dec72d",
        pcbRotationOffset: 90,
        modelOriginPosition: { x: -0.000012700000070253736, y: 0.000012700000070253736, z: -0.048939 },
      }}
      {...props}
    />
  )
}