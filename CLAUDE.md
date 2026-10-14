# CLAUDE.md

Project repo for a 16-channel USB 2.0 HS logic analyzer (Lattice ECP5 + SDRAM + FT2232H, 6 layers).
The VibePCB tooling (pipeline, `fixes.py`, `check`, `fab`, `publish`, tscircuit skill) is the sibling
checkout `../VibePCB`: read its `CLAUDE.md` and `docs/TOOLING.md` first. Commands run from here
(`hatch run pcb all <board>`); fix generic tool problems in `../VibePCB`, not here.

Plan: spikes first (`boards/la-bga-spike`: BGA fan-out on 6 layers; `boards/la-usb-spike`: USB HS
diff pair), then the full board `boards/la-main`.

This repo uses the latest tscircuit (no local node_modules patches, unlike VibePCB-smu): record any
router workaround here.
