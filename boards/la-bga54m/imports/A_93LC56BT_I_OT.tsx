import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["DO"],
  pin2: ["VSS"],
  pin3: ["DI"],
  pin4: ["CLK"],
  pin5: ["CS"],
  pin6: ["VCC"]
} as const

const pinAttributes = {
  pin2: {requiresGround: true},
  pin6: {requiresPower: true}
} as const

export const A_93LC56BT_I_OT = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      pinAttributes={pinAttributes}
      supplierPartNumbers={{
  "jlcpcb": [
    "C190271"
  ]
}}
      manufacturerPartNumber="93LC56BT-I/OT"
      footprint="soic6_p0.95mm_w3.8mm_pl1.1mm_pin1location(rightside,bottom)"
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C190271.obj?uuid=229b69761e2c45dba6a83d8866dec72d",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C190271.step?uuid=229b69761e2c45dba6a83d8866dec72d",
        pcbRotationOffset: 180,
        modelOriginPosition: { x: 0.000025399999913133797, y: -0.0000889000000370288, z: -0.048939 },
      }}
      {...props}
    />
  )
}