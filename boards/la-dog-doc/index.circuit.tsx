// tscircuit's documented dogbone example (docs/elements/fanout.mdx), as a sanity check of this version
export default () => (
  <board width={10} height={10} layers={4} routeRemaining={false}
    minTraceWidth={0.1} minViaPadDiameter={0.4} minViaHoleDiameter={0.15}>
    <fanout autorouter="dogbone" fanoutRoutingLayers={["inner2"]}>
      <chip name="U1" footprint="bga36_grid6x6_p1mm_w6mm_h6mm_pad0.5mm_circularpads"
        connections={{
          pin1: "net.DATA0", pin6: "net.DATA1", pin8: "net.VCC", pin15: "net.GND",
          pin22: "net.CLOCK", pin29: "net.ENABLE", pin31: "net.DATA2", pin36: "net.DATA3",
        }}
      />
    </fanout>
  </board>
)
