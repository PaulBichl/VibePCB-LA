import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["pin1"],
  pin2: ["pin2"],
  pin3: ["pin3"],
  pin4: ["pin4"],
  pin5: ["pin5"],
  pin6: ["pin6"],
  pin7: ["pin7"],
  pin8: ["pin8"]
} as const

export const A_4D02WGJ0102TCE = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      supplierPartNumbers={{
  "jlcpcb": [
    "C25726"
  ]
}}
      manufacturerPartNumber="4D02WGJ0102TCE"
      footprint={<footprint>
        <smtpad portHints={["pin1"]} pcbX="-0.750062mm" pcbY="0.427482mm" width="0.2999994mm" height="0.5050028mm" shape="rect" />
<smtpad portHints={["pin2"]} pcbX="-0.249936mm" pcbY="0.427482mm" width="0.2999994mm" height="0.5050028mm" shape="rect" />
<smtpad portHints={["pin3"]} pcbX="0.249936mm" pcbY="0.427482mm" width="0.2999994mm" height="0.5050028mm" shape="rect" />
<smtpad portHints={["pin4"]} pcbX="0.750062mm" pcbY="0.427482mm" width="0.2999994mm" height="0.5050028mm" shape="rect" />
<smtpad portHints={["pin8"]} pcbX="-0.750062mm" pcbY="-0.427482mm" width="0.2999994mm" height="0.5050028mm" shape="rect" />
<smtpad portHints={["pin7"]} pcbX="-0.249936mm" pcbY="-0.427482mm" width="0.2999994mm" height="0.5050028mm" shape="rect" />
<smtpad portHints={["pin6"]} pcbX="0.249936mm" pcbY="-0.427482mm" width="0.2999994mm" height="0.5050028mm" shape="rect" />
<smtpad portHints={["pin5"]} pcbX="0.750062mm" pcbY="-0.427482mm" width="0.2999994mm" height="0.5050028mm" shape="rect" />
<silkscreenpath route={[{"x":-1.2285980000000336,"y":-0.17503140000007988},{"x":-1.2285980000000336,"y":-0.9086087999999108},{"x":1.22854719999998,"y":-0.9086087999999108},{"x":1.22854719999998,"y":-0.17503140000007988}]} />
<silkscreenpath route={[{"x":-1.2285980000000336,"y":0.17498060000002624},{"x":-1.2285980000000336,"y":0.9085580000000846},{"x":1.22854719999998,"y":0.9085580000000846},{"x":1.22854719999998,"y":0.17498060000002624}]} />
<silkscreentext text="{NAME}" pcbX="0.0127mm" pcbY="1.9144mm" anchorAlignment="center" fontSize="1mm" />
<courtyardoutline outline={[{"x":-1.2500234000001456,"y":0.9299834000000828},{"x":1.249972600000092,"y":0.9299834000000828},{"x":1.249972600000092,"y":-0.9299834000000828},{"x":-1.2500234000001456,"y":-0.9299834000000828},{"x":-1.2500234000001456,"y":0.9299834000000828}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C25726.obj?uuid=1d324b06813d4a308bd2dcbf7154a8e0",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C25726.step?uuid=1d324b06813d4a308bd2dcbf7154a8e0",
        pcbRotationOffset: 180,
        modelOriginPosition: { x: -0.000025400000026820635, y: -0.000025399999913133797, z: 0 },
      }}
      {...props}
    />
  )
}