import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["N_CS"],
  pin2: ["DO"],
  pin3: ["IO2"],
  pin4: ["GND"],
  pin5: ["DI"],
  pin6: ["CLK"],
  pin7: ["IO3"],
  pin8: ["VCC"]
} as const

const pinAttributes = {
  pin4: {requiresGround: true},
  pin8: {isInput: true, requiresPower: true},
  pin1: {isInput: true, capabilities: ["spi_cs"]},
  pin2: {isBidirectional: true, canUseTriState: true, capabilities: ["spi_miso"], canUsePushPull: true},
  pin3: {isBidirectional: true, canUseTriState: true, canUsePushPull: true},
  pin7: {isBidirectional: true, canUseTriState: true, canUsePushPull: true},
  pin6: {isInput: true, capabilities: ["spi_sck"]},
  pin5: {isBidirectional: true, canUseTriState: true, capabilities: ["spi_mosi"], canUsePushPull: true}
} satisfies NonNullable<ChipProps["pinAttributes"]>

export const W25Q128JVSIQ = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      pinAttributes={pinAttributes}
      supplierPartNumbers={{
  "jlcpcb": [
    "C97521"
  ]
}}
      manufacturerPartNumber="W25Q128JVSIQ"
      footprint="soic8_pillpads_w9.31mm_pw0.63mm_pl2.25mm_pin1location(leftside,bottom)"
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C97521.obj?uuid=4652e19b90fa4dbb8662aa4cba61a532",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C97521.step?uuid=4652e19b90fa4dbb8662aa4cba61a532",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0.000012700000070253736, y: -0.000012699999956566899, z: -0.069425 },
      }}
      {...props}
    />
  )
}