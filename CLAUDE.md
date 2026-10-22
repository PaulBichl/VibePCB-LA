# CLAUDE.md

Project repo for a 16-channel USB 2.0 HS logic analyzer (ECP5 CABGA-256 + BGA SDRAM + FT2232H, 6 layers).
The VibePCB tooling (pipeline, `fixes.py`, `check`, `fab`, `publish`, tscircuit skill) is the sibling
checkout `../VibePCB`: read its `CLAUDE.md` and `docs/TOOLING.md` first. Commands run from here
(`hatch run pcb all <board>`); fix generic tool problems in `../VibePCB`, not here.

One board: `boards/la-ecp5` (board config: `boards/la-ecp5/vibepcb.toml`, routing order: `routes.toml`).
tscircuit only places; VibePCB escapes both BGAs and routes (`[routing] mode = "manual"`). The repo is a
showcase: after a board change that passes `check`, run `hatch run pcb publish la-ecp5` and commit
`boards/la-ecp5/hardware/` (the README links into it). The earlier boards (iCE40 TQFP-144 `la-main`, the
BGA / QFP / USB spikes, the ECP5 escape and routing variants) are in git history; their lessons are below
and in `../VibePCB` (CLAUDE.md, docs/TODO.md "BGA support").

This repo uses the latest tscircuit (no local node_modules patches, unlike VibePCB-smu): record any
router workaround here.

## Findings (tscircuit core 0.0.2891, capacity-autorouter 0.0.982; la-ecp5 is built with 0.0.2900)

- Copper pours need `boardEdgeMargin="0.5mm"` (default 0.2 mm fails the placement gate).
- More than 50 traces: the board needs `routeRemaining` (else tscircuit refuses to route).
- `<differentialpair>` sides must be single point-to-point connections: a net with a third pad
  (USB-C DP1 + DP2) crashes the router ("matches multiple SRJ connections"). Declare the pair
  where the line is point-to-point (ESD -> FT2232H); VibePCB's build now stops on such crashes.
- KiCad diff pairs need net names ending in `_P` / `_N`: name the traces (`USB_P`), the nets take
  the trace names (`vibepcb.toml` holds the net class and the uncoupled-length rule).
- BGA (ECP5 CABGA-256, 0.8 mm) with tscircuit's router (why la-ecp5 uses VibePCB's router):
  - `<breakout>` boundary fan-out: only 60 of 99 connections escape (inner rings), more room
    doesn't help.
  - `autorouter="dogbone"` crashes on any board with a copper pour on an escaped net (reproduced
    with tscircuit's own docs example + plane pours: "Dogbone connection ... has no source pad").
  - Self-computed dogbones via `pcbTracePaths` avoid that crash, but the global router then fails
    in TopologyMergingSolver ("unresolved inter-group overlap" at a ball) - the known BGA issue
    tscircuit's docs mention.
- QFP (iCE40HX4K TQFP-144, 0.5 mm) works: routes in ~1 min, passes `check` (la-qfp-spike, then la-main; both in git history), with
  - the FPGA rotated so its IO groups face their partners: the imported footprint puts pin 1 on its
    *bottom* side (`pin1location(bottomside,left)`), i.e. 90 deg off the datasheet drawing - check
    where each pin group lands (circuit JSON port positions) before assigning pins by side;
  - a bus that doesn't fit one side split over both corners next to its partner (one corner took
    44 errors of vias crowding, split: 0);
  - length groups in `vibepcb.toml` from the timing budget (KiCad checks them; no tscircuit `<bus>`).
