# VibePCB logic analyzer (work in progress)

A 16-channel USB 2.0 HS logic analyzer: Lattice ECP5 FPGA capturing into SDRAM, read out over an
FT2232H. Designed with [VibePCB](https://github.com/PaulBichl/vibepcb) (tscircuit -> KiCad) as a
deliberate stretch of the tooling: 0.8 mm BGA, a length-matched memory bus, a 90 ohm differential
pair, 6 layers with split supply planes.

Status: feasibility spikes (`boards/la-*-spike`, variants). See `CLAUDE.md` for what tscircuit can
and can't do here yet.

## Target spec

| | |
|---|---|
| Channels | 16, two banks of 8, threshold per bank (I/O rail 1.2-3.6 V, threshold ~ rail / 2) |
| Sample rate | 100 MSa/s x 16 into SDRAM (200+ MSa/s with DDR inputs as stretch goal) |
| Buffer | 32 MB (256 Mbit 16-bit SDR SDRAM) = 16 M samples x 16 ch |
| Streaming | ~40 MB/s over USB 2.0 HS (FT2232H sync FIFO): 16 ch at ~20 MSa/s |
| Inputs | 1 Mohm, series resistor + Schottky clamps to the bank rail / GND (survive +-12 V) |
| Probe | 2x10 2.54 mm header (16 signals + GND) |
| Power | USB-C 5 V, < 2.5 W |

## Architecture

```
probe header --> 1k + BAT54S clamps --> 74LVC8T245 x2 (A side = bank rail) --> ECP5 bank 6/7
                                              ^ bank rail: FPGA PWM -> RC -> op-amp buffer (x2)
ECP5 LFE5U-25F (CABGA-256) <-- 25 MHz oscillator (PLL to 100/200 MHz)
   bank 2/3  <--> W9825G6KH SDRAM (16-bit, length-matched DQ and addr/ctrl groups)
   bank 0/1  <--> FT2232H channel A (245 sync FIFO, 8 data + 6 control)
   bank 8    <--> W25Q128 SPI config flash; FT2232H channel B programs it (MPSSE)
FT2232H <--> USBLC6 ESD <--> USB-C (90 ohm pair), 93LC56 EEPROM (FIFO mode config), 12 MHz crystal
5 V --> TLV62569 3.3 V (IO, SDRAM, FT2232H) / TLV62569 1.1 V (ECP5 core) / AP2112K 2.5 V (VCCAUX)
```

Stack-up (6 layers): top signals + GND / In1 GND / In2 signals + GND / In3 split power
(3.3 V, 1.1 V, 2.5 V) / In4 GND / bottom signals + GND. Net classes, the USB pair and the SDRAM
length groups live in `boards/<board>/vibepcb.toml`.

## Parts (JLCPCB, stock checked 2026-10-15)

| Part | LCSC | Stock |
|------|------|-------|
| LFE5U-25F-7BG256I | C1550762 | 1277 |
| W9825G6KH-6 | C62246 | 6.8k |
| FT2232HL | C27882 | 500 |
| SN74LVC8T245PWR | C27643 | 41k |
| W25Q128JVSIQ | C97521 | 55k (basic) |
| 93LC56BT-I/OT | C190271 | 9.2k |
| 25 MHz oscillator OT322525MJBA4SL | C669088 | 47k |
| TLV62569DBVR | C141836 | 416k |
| AP2112K-2.5TRG1 | C176945 | 2.9k |
| USBLC6-2SC6 | C7519 | stocked |
| BAT54S | C12765 | 185k |

Out of scope for the board repo: FPGA gateware and the host software (a sigrok driver).
