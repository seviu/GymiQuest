import { describe, expect, it } from "vitest"
import { parseStandardMidi } from "./midiPlayer"

function oneNoteMidi(): ArrayBuffer {
  return new Uint8Array([
    0x4d, 0x54, 0x68, 0x64,
    0x00, 0x00, 0x00, 0x06,
    0x00, 0x00,
    0x00, 0x01,
    0x00, 0x60,
    0x4d, 0x54, 0x72, 0x6b,
    0x00, 0x00, 0x00, 0x16,
    0x00, 0xff, 0x51, 0x03, 0x05, 0xb8, 0xd8,
    0x00, 0xc0, 0x34,
    0x00, 0x90, 0x3c, 0x64,
    0x60, 0x80, 0x3c, 0x00,
    0x00, 0xff, 0x2f, 0x00,
  ]).buffer
}

describe("parseStandardMidi", () => {
  it("parses tempo, program, and note timing from a Standard MIDI file", () => {
    const song = parseStandardMidi(oneNoteMidi())

    expect(song.trackCount).toBe(1)
    expect(song.playableTrackCount).toBe(1)
    expect(song.ticksPerQuarter).toBe(96)
    expect(song.durationSeconds).toBeCloseTo(0.375, 5)
    expect(song.notes).toEqual([{
      channel: 0,
      durationSeconds: 0.375,
      note: 60,
      program: 52,
      startSeconds: 0,
      velocity: 100,
    }])
  })

  it("rejects a truncated MIDI file", () => {
    const truncated = new Uint8Array([0x4d, 0x54, 0x68, 0x64, 0, 0, 0, 6]).buffer
    expect(() => parseStandardMidi(truncated)).toThrow("truncated")
  })
})
