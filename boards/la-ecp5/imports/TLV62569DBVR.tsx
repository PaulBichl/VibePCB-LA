import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["EN"],
  pin2: ["GND"],
  pin3: ["SW"],
  pin4: ["VIN"],
  pin5: ["FB"]
} as const

const pinAttributes = {
  pin2: {capabilities: [], requiresGround: true, requiresVoltage: 0, mustBeConnected: true},
  pin4: {isInput: true, capabilities: [], requiresPower: true, mustBeConnected: true, shouldHaveDecouplingCapacitor: true},
  pin5: {isInput: true, capabilities: [], mustBeConnected: true},
  pin3: {isOutput: true, capabilities: [], providesPower: true},
  pin1: {isInput: true, capabilities: [], mustBeConnected: true}
} satisfies NonNullable<ChipProps["pinAttributes"]>

export const TLV62569DBVR = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      pinAttributes={pinAttributes}
      supplierPartNumbers={{
  "jlcpcb": [
    "C141836"
  ]
}}
      manufacturerPartNumber="TLV62569DBVR"
      footprint="sot25_w2.6mm_pl1.1mm_pin1location(rightside,bottom)"
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C141836.obj?uuid=460193f9bf2d42e58cf3c2f675b07dc6",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C141836.step?uuid=460193f9bf2d42e58cf3c2f675b07dc6",
        pcbRotationOffset: 180,
        modelOriginPosition: { x: 0, y: -0.000012700000070253736, z: -0.049083 },
      }}
      {...props}
    />
  )
}