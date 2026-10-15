import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["N_CS"],
  pin2: ["DO","IO1"],
  pin3: ["N_WP","IO2"],
  pin4: ["GND"],
  pin5: ["DI","IO0"],
  pin6: ["CLK"],
  pin7: ["N_HOLD_OR__REST","IO3"],
  pin8: ["VCC"],
  pin9: ["EP"]
} as const

const pinAttributes = {
  pin4: {requiresGround: true},
  pin8: {requiresPower: true}
} as const

const footprinterPinLabels = {
  ...pinLabels,
  "pin9": [...pinLabels["pin9"], "thermalpad"],
} as const

export const W25Q128JVPIQ = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={footprinterPinLabels}
      pinAttributes={pinAttributes}
      supplierPartNumbers={{
  "jlcpcb": [
    "C190862"
  ]
}}
      manufacturerPartNumber="W25Q128JVPIQ"
      footprint="dfn8_thermalpad3.4mmx4.3mm_pillpads_w7.31mm_pw0.58mm_pl1.28mm_pin1location(leftside,bottom)"
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C190862.obj?uuid=aeccbecea0df4df4a2a68061a89a4c8e",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C190862.step?uuid=aeccbecea0df4df4a2a68061a89a4c8e",
        pcbRotationOffset: 90,
        modelOriginPosition: { x: 0, y: 0, z: 0 },
      }}
      {...props}
    />
  )
}