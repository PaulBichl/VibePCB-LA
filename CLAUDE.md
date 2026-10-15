# CLAUDE.md

Project repo for a 16-channel USB 2.0 HS logic analyzer (iCE40HX4K TQFP-144 + SDRAM + FT2232H, 4 layers).
The VibePCB tooling (pipeline, `fixes.py`, `check`, `fab`, `publish`, tscircuit skill) is the sibling
checkout `../VibePCB`: read its `CLAUDE.md` and `docs/TOOLING.md` first. Commands run from here
(`hatch run pcb all <board>`); fix generic tool problems in `../VibePCB`, not here.

One board: `boards/la-main` (board config: `boards/la-main/vibepcb.toml`). The feasibility spikes
(ECP5 BGA variants, USB diff pair, QFP) were deleted after their lessons landed below and in
`../VibePCB` (CLAUDE.md, docs/TODO.md "BGA support"); they are in git history before this note.

This repo uses the latest tscircuit (no local node_modules patches, unlike VibePCB-smu): record any
router workaround here.

## Findings (tscircuit core 0.0.2891, capacity-autorouter 0.0.982)

- Copper pours need `boardEdgeMargin="0.5mm"` (default 0.2 mm fails the placement gate).
- More than 50 traces: the board needs `routeRemaining` (else tscircuit refuses to route).
- `<differentialpair>` sides must be single point-to-point connections: a net with a third pad
  (USB-C DP1 + DP2) crashes the router ("matches multiple SRJ connections"). Declare the pair
  where the line is point-to-point (ESD -> FT2232H); VibePCB's build now stops on such crashes.
- KiCad diff pairs need net names ending in `_P` / `_N`: name the traces (`USB_P`), the nets take
  the trace names (`vibepcb.toml` holds the net class and the uncoupled-length rule).
- BGA (ECP5 CABGA-256, 0.8 mm):
  - `<breakout>` boundary fan-out: only 60 of 99 connections escape (inner rings), more room
    doesn't help.
  - `autorouter="dogbone"` crashes on any board with a copper pour on an escaped net (reproduced
    with tscircuit's own docs example + plane pours: "Dogbone connection ... has no source pad").
  - Self-computed dogbones via `pcbTracePaths` avoid that crash, but the global router then fails
    in TopologyMergingSolver ("unresolved inter-group overlap" at a ball) - the known BGA issue
    tscircuit's docs mention.
- QFP (iCE40HX4K TQFP-144, 0.5 mm) works: routes in ~1 min, passes `check` (la-qfp-spike), with
  - the FPGA rotated so its IO groups face their partners: the imported footprint puts pin 1 on its
    *bottom* side (`pin1location(bottomside,left)`), i.e. 90 deg off the datasheet drawing - check
    where each pin group lands (circuit JSON port positions) before assigning pins by side;
  - a bus that doesn't fit one side split over both corners next to its partner (one corner took
    44 errors of vias crowding, split: 0);
  - length groups in `vibepcb.toml` from the timing budget (KiCad checks them; no tscircuit `<bus>`).
