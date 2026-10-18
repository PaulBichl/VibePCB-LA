import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["IO1_A"],
  pin2: ["GND"],
  pin3: ["IO2_A"],
  pin4: ["IO2_B"],
  pin5: ["VBUS"],
  pin6: ["IO1_B"]
} as const

const pinAttributes = {
  pin1: {isPassive: true},
  pin2: {requiresGround: true, mustBeConnected: true},
  pin3: {isPassive: true},
  pin4: {isPassive: true},
  pin5: {isPassive: true, mustBeConnected: true, shouldHaveDecouplingCapacitor: true, recommendedDecouplingCapacitorCapacitance: "100nF"},
  pin6: {isPassive: true}
} satisfies NonNullable<ChipProps["pinAttributes"]>

export const USBLC6_2SC6 = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      pinAttributes={pinAttributes}
      supplierPartNumbers={{
  "jlcpcb": [
    "C7519"
  ]
}}
      manufacturerPartNumber="USBLC6-2SC6"
      footprint="dfn6_p0.95mm_w3.3702mm_pw0.532mm_pl1.072mm_pin1location(leftside,bottom)"
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C7519.obj?uuid=229b69761e2c45dba6a83d8866dec72d",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C7519.step?uuid=229b69761e2c45dba6a83d8866dec72d",
        pcbRotationOffset: 90,
        modelOriginPosition: { x: -0.000012700000070253736, y: 0.000012700000070253736, z: -0.048939 },
      }}
      {...props}
    />
  )
}