# VibePCB logic analyzer (work in progress)

A 16-channel USB 2.0 HS logic analyzer: an iCE40HX4K FPGA capturing into SDRAM, read out over an
FT2232H. Designed with [VibePCB](https://github.com/PaulBichl/vibepcb) (tscircuit -> KiCad) as a
stretch of the tooling: a 0.5 mm QFP FPGA, a length-checked memory bus, a 90 ohm differential pair,
power pads via-stitched to their planes. (A BGA version is a future topic, see `CLAUDE.md`.)

Status: `boards/la-main` passes `check` (KiCad DRC/ERC, house rules); review and SPICE of the input
front end are next.

## Target spec

| | |
|---|---|
| Channels | 16, two banks of 8, threshold per bank (I/O rail 1.2-5 V, threshold ~ rail / 2) |
| Sample rate | 100 MSa/s x 16 into SDRAM |
| Buffer | 32 MB (256 Mbit 16-bit SDR SDRAM) = 16 M samples x 16 ch |
| Streaming | ~40 MB/s over USB 2.0 HS (FT2232H sync FIFO): 16 ch at ~20 MSa/s |
| Inputs | 1 Mohm, 1k series + SRV05-4 clamps to the bank rail / GND |
| Probe | 2x10 2.54 mm header (16 signals + GND) |
| Power | USB-C 5 V, < 2.5 W |

## Architecture

```
probe header --> 1k arrays + SRV05-4 clamps --> 74LVC8T245 x2 (A side = bank rail) --> iCE40 left side
                                                   ^ bank rail: FPGA PWM -> RC -> TLV9062 (gain 1.5), x2
iCE40HX4K (TQFP-144) <-- 100 MHz oscillator (global clock input)
   right side + corners <--> W9825G6KH SDRAM (16-bit, pins paired by position, length groups checked)
   top side             <--> FT2232H channel A (245 sync FIFO, 8 data + 7 control, CLKOUT on a global input)
   SPI pins             <--> W25Q128 config flash; FT2232H channel B programs it (MPSSE)
FT2232H <--> USBLC6 ESD <--> USB-C (90 ohm pair), 93LC56 EEPROM (FIFO mode), 12 MHz crystal
5 V --> TLV62569 3.3 V / TLV62569 1.2 V (iCE40 core)
```

Stack-up (4 layers): top signals + GND / In1 GND / In2 3.3 V / bottom signals + GND. Net classes,
the USB pair, the SDRAM length groups and the via-stitched planes live in `boards/la-main/vibepcb.toml`.

## Parts (JLCPCB, stock checked 2026-10-15)

| Part | LCSC | Stock |
|------|------|-------|
| ICE40HX4K-TQ144 | C1521989 | 36 |
| W9825G6KH-6 | C62246 | 6.8k |
| FT2232HL | C27882 | 500 |
| SN74LVC8T245PWR | C27643 | 41k |
| W25Q128JVSIQ | C97521 | 55k (basic) |
| 93LC56BT-I/OT | C190271 | 9.2k |
| 100 MHz oscillator SX3M100.000B20F30TNN | C5179979 | 21k |
| TLV62569DBVR | C141836 | 416k |
| USBLC6-2SC6 | C7519 | stocked |
| SRV05-4 | C2836319 | 377k |
| TLV9062IDR | C398355 | 165k |

Out of scope for the board repo: FPGA gateware and the host software (a sigrok driver).
