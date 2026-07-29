export interface MidiNoteEvent {
  channel: number
  durationSeconds: number
  note: number
  program: number
  startSeconds: number
  velocity: number
}

export interface ParsedMidiSong {
  durationSeconds: number
  notes: readonly MidiNoteEvent[]
  playableTrackCount: number
  ticksPerQuarter: number
  trackCount: number
}

interface RawMidiNote {
  channel: number
  endTick: number
  note: number
  program: number
  startTick: number
  velocity: number
}

interface ActiveMidiNote {
  program: number
  startTick: number
  velocity: number
}

interface TempoChange {
  microsecondsPerQuarter: number
  tick: number
}

class MidiReader {
  private offset = 0

  constructor(private readonly bytes: Uint8Array) {}

  get remaining(): number {
    return this.bytes.length - this.offset
  }

  private require(count: number) {
    if (!Number.isInteger(count) || count < 0 || this.offset + count > this.bytes.length) {
      throw new Error("The MIDI file is truncated.")
    }
  }

  readAscii(count: number): string {
    this.require(count)
    const value = String.fromCharCode(...this.bytes.subarray(this.offset, this.offset + count))
    this.offset += count
    return value
  }

  readByte(): number {
    this.require(1)
    return this.bytes[this.offset++]!
  }

  readBytes(count: number): Uint8Array {
    this.require(count)
    const value = this.bytes.subarray(this.offset, this.offset + count)
    this.offset += count
    return value
  }

  readUint16(): number {
    return (this.readByte() << 8) | this.readByte()
  }

  readUint24(): number {
    return (this.readByte() << 16) | (this.readByte() << 8) | this.readByte()
  }

  readUint32(): number {
    return ((this.readByte() * 0x1000000) + (this.readByte() << 16) + (this.readByte() << 8) + this.readByte()) >>> 0
  }

  readVariableLength(): number {
    let value = 0
    for (let count = 0; count < 4; count += 1) {
      const byte = this.readByte()
      value = (value << 7) | (byte & 0x7f)
      if ((byte & 0x80) === 0) return value
    }
    throw new Error("The MIDI file contains an invalid variable-length value.")
  }

  skip(count: number) {
    this.require(count)
    this.offset += count
  }
}

function closeActiveNote(
  activeNotes: Map<string, ActiveMidiNote[]>,
  rawNotes: RawMidiNote[],
  channel: number,
  note: number,
  endTick: number,
) {
  const key = `${channel}:${note}`
  const active = activeNotes.get(key)
  const started = active?.shift()
  if (!started) return
  if (active?.length === 0) activeNotes.delete(key)
  rawNotes.push({
    channel,
    endTick: Math.max(endTick, started.startTick + 1),
    note,
    program: started.program,
    startTick: started.startTick,
    velocity: started.velocity,
  })
}

function parseTrack(
  bytes: Uint8Array,
  rawNotes: RawMidiNote[],
  tempoChanges: TempoChange[],
): { finalTick: number; hasNotes: boolean } {
  const reader = new MidiReader(bytes)
  const activeNotes = new Map<string, ActiveMidiNote[]>()
  const programs = Array.from({ length: 16 }, () => 0)
  let runningStatus: number | undefined
  let tick = 0
  let hasNotes = false

  while (reader.remaining > 0) {
    tick += reader.readVariableLength()
    const candidate = reader.readByte()
    let status: number
    let firstDataByte: number | undefined

    if (candidate < 0x80) {
      if (runningStatus === undefined) throw new Error("The MIDI file uses running status before a channel event.")
      status = runningStatus
      firstDataByte = candidate
    } else {
      status = candidate
      if (status < 0xf0) runningStatus = status
    }

    if (status === 0xff) {
      const type = reader.readByte()
      const length = reader.readVariableLength()
      if (type === 0x51 && length === 3) {
        tempoChanges.push({ tick, microsecondsPerQuarter: reader.readUint24() })
      } else {
        reader.skip(length)
      }
      continue
    }

    if (status === 0xf0 || status === 0xf7) {
      reader.skip(reader.readVariableLength())
      continue
    }

    if (status >= 0xf0) throw new Error(`Unsupported MIDI system event 0x${status.toString(16)}.`)

    const eventType = status & 0xf0
    const channel = status & 0x0f
    const first = firstDataByte ?? reader.readByte()

    if (eventType === 0xc0) {
      programs[channel] = first & 0x7f
      continue
    }
    if (eventType === 0xd0) continue

    const second = reader.readByte()
    if (eventType === 0x90 && second > 0) {
      const key = `${channel}:${first}`
      const active = activeNotes.get(key) ?? []
      active.push({ startTick: tick, velocity: second, program: programs[channel]! })
      activeNotes.set(key, active)
      hasNotes = true
    } else if (eventType === 0x80 || (eventType === 0x90 && second === 0)) {
      closeActiveNote(activeNotes, rawNotes, channel, first, tick)
    }
  }

  for (const [key, active] of activeNotes) {
    const [channelText, noteText] = key.split(":")
    for (const started of active) {
      rawNotes.push({
        channel: Number(channelText),
        endTick: Math.max(tick, started.startTick + 1),
        note: Number(noteText),
        program: started.program,
        startTick: started.startTick,
        velocity: started.velocity,
      })
    }
  }

  return { finalTick: tick, hasNotes }
}

function buildTickConverter(changes: readonly TempoChange[], ticksPerQuarter: number) {
  const tempoAtTick = new Map<number, number>([[0, 500_000]])
  for (const change of changes) tempoAtTick.set(change.tick, change.microsecondsPerQuarter)
  const ordered = [...tempoAtTick]
    .map(([tick, microsecondsPerQuarter]) => ({ tick, microsecondsPerQuarter }))
    .sort((left, right) => left.tick - right.tick)

  const points: Array<TempoChange & { seconds: number }> = []
  let priorTick = 0
  let seconds = 0
  let tempo = 500_000
  for (const change of ordered) {
    seconds += ((change.tick - priorTick) * tempo) / ticksPerQuarter / 1_000_000
    points.push({ ...change, seconds })
    priorTick = change.tick
    tempo = change.microsecondsPerQuarter
  }

  return (tick: number): number => {
    let low = 0
    let high = points.length - 1
    while (low < high) {
      const middle = Math.ceil((low + high) / 2)
      if (points[middle]!.tick <= tick) low = middle
      else high = middle - 1
    }
    const point = points[low]!
    return point.seconds + ((tick - point.tick) * point.microsecondsPerQuarter) / ticksPerQuarter / 1_000_000
  }
}

export function parseStandardMidi(buffer: ArrayBuffer): ParsedMidiSong {
  if (buffer.byteLength > 5 * 1024 * 1024) throw new Error("The MIDI file is too large for background playback.")
  const reader = new MidiReader(new Uint8Array(buffer))
  if (reader.readAscii(4) !== "MThd") throw new Error("The file is not a Standard MIDI file.")
  const headerLength = reader.readUint32()
  if (headerLength < 6) throw new Error("The MIDI header is invalid.")
  const format = reader.readUint16()
  const trackCount = reader.readUint16()
  const division = reader.readUint16()
  reader.skip(headerLength - 6)

  if (format !== 0 && format !== 1) throw new Error(`Unsupported MIDI format ${format}.`)
  if (trackCount < 1 || trackCount > 64) throw new Error("The MIDI track count is invalid.")
  if ((division & 0x8000) !== 0 || division === 0) throw new Error("SMPTE-timed MIDI files are not supported.")

  const rawNotes: RawMidiNote[] = []
  const tempoChanges: TempoChange[] = []
  let finalTick = 0
  let playableTrackCount = 0

  for (let trackIndex = 0; trackIndex < trackCount; trackIndex += 1) {
    if (reader.readAscii(4) !== "MTrk") throw new Error(`MIDI track ${trackIndex + 1} is missing.`)
    const trackLength = reader.readUint32()
    const track = parseTrack(reader.readBytes(trackLength), rawNotes, tempoChanges)
    finalTick = Math.max(finalTick, track.finalTick)
    if (track.hasNotes) playableTrackCount += 1
  }

  if (rawNotes.length === 0) throw new Error("The MIDI file has no notes.")
  if (rawNotes.length > 100_000) throw new Error("The MIDI file contains too many notes.")

  const secondsAtTick = buildTickConverter(tempoChanges, division)
  const notes = rawNotes
    .map<MidiNoteEvent>((event) => ({
      channel: event.channel,
      durationSeconds: secondsAtTick(event.endTick) - secondsAtTick(event.startTick),
      note: event.note,
      program: event.program,
      startSeconds: secondsAtTick(event.startTick),
      velocity: event.velocity,
    }))
    .sort((left, right) => left.startSeconds - right.startSeconds || left.note - right.note)

  return {
    durationSeconds: secondsAtTick(finalTick),
    notes,
    playableTrackCount,
    ticksPerQuarter: division,
    trackCount,
  }
}

interface SynthProfile {
  attack: number
  cutoff: number
  level: number
  release: number
  sustain: number
  wave: OscillatorType
}

function synthProfile(program: number): SynthProfile {
  if (program >= 32 && program <= 39) {
    return { attack: 0.008, cutoff: 900, level: 0.12, release: 0.16, sustain: 0.58, wave: "square" }
  }
  if (program >= 48 && program <= 51) {
    return { attack: 0.08, cutoff: 2_200, level: 0.065, release: 0.4, sustain: 0.78, wave: "sawtooth" }
  }
  if (program >= 52 && program <= 55) {
    return { attack: 0.13, cutoff: 1_800, level: 0.07, release: 0.45, sustain: 0.82, wave: "triangle" }
  }
  if (program >= 24 && program <= 31) {
    return { attack: 0.006, cutoff: 2_700, level: 0.09, release: 0.2, sustain: 0.3, wave: "triangle" }
  }
  return { attack: 0.005, cutoff: 3_400, level: 0.08, release: 0.28, sustain: 0.24, wave: "triangle" }
}

type AudioContextConstructor = new (contextOptions?: AudioContextOptions) => AudioContext

function audioContextConstructor(): AudioContextConstructor | undefined {
  const audioGlobal = globalThis as typeof globalThis & { webkitAudioContext?: AudioContextConstructor }
  return audioGlobal.AudioContext ?? audioGlobal.webkitAudioContext
}

export class MidiMusicPlayer {
  private anchorTime = 0
  private context?: AudioContext
  private loadPromise?: Promise<ParsedMidiSong>
  private nextNoteIndex = 0
  private noiseBuffer?: AudioBuffer
  private operation = 0
  private output?: AudioNode
  private playing = false
  private positionSeconds = 0
  private scheduler?: ReturnType<typeof setInterval>
  private song?: ParsedMidiSong
  private readonly voiceStoppers = new Set<() => void>()
  private wantsPlayback = false

  constructor(private readonly url: string) {}

  private async load(): Promise<ParsedMidiSong> {
    if (!this.loadPromise) {
      this.loadPromise = fetch(this.url, { cache: "force-cache", credentials: "same-origin" })
        .then(async (response) => {
          if (!response.ok) throw new Error(`MIDI request failed with ${response.status}.`)
          return parseStandardMidi(await response.arrayBuffer())
        })
        .catch((error) => {
          this.loadPromise = undefined
          throw error
        })
    }
    return this.loadPromise
  }

  private ensureContext(): AudioContext {
    if (this.context) return this.context
    const Context = audioContextConstructor()
    if (!Context) throw new Error("This browser does not support Web Audio.")
    const context = new Context({ latencyHint: "playback" })
    const masterGain = context.createGain()
    masterGain.gain.value = 0.12
    const compressor = context.createDynamicsCompressor()
    compressor.threshold.value = -24
    compressor.knee.value = 18
    compressor.ratio.value = 5
    compressor.attack.value = 0.006
    compressor.release.value = 0.22
    masterGain.connect(compressor)
    compressor.connect(context.destination)
    this.context = context
    this.output = masterGain
    return context
  }

  async play(): Promise<boolean> {
    if (this.playing) return true
    this.wantsPlayback = true
    const operation = ++this.operation
    const context = this.ensureContext()
    if (context.state !== "running") {
      // A direct button press unlocks audio in normal browsers. Headless Firefox can
      // leave the resume promise pending when no audio device exists, so scheduling
      // must not leave the control stuck in a permanent loading state.
      void context.resume().catch(() => undefined)
    }
    const song = await this.load()
    if (!this.wantsPlayback || operation !== this.operation) return false

    this.song = song
    this.playing = true
    const startDelay = 0.07
    this.positionSeconds %= song.durationSeconds
    this.anchorTime = context.currentTime - this.positionSeconds + startDelay
    this.nextNoteIndex = this.firstNoteAtOrAfter(this.positionSeconds)
    this.schedule()
    this.scheduler = setInterval(() => this.schedule(), 100)
    return true
  }

  pause() {
    this.wantsPlayback = false
    this.operation += 1
    if (this.playing && this.context && this.song) {
      const elapsed = Math.max(0, this.context.currentTime - this.anchorTime)
      this.positionSeconds = elapsed % this.song.durationSeconds
    }
    this.playing = false
    if (this.scheduler !== undefined) clearInterval(this.scheduler)
    this.scheduler = undefined
    for (const stop of this.voiceStoppers) stop()
    this.voiceStoppers.clear()
  }

  dispose() {
    this.pause()
    if (this.context && this.context.state !== "closed") void this.context.close()
    this.context = undefined
    this.output = undefined
  }

  private firstNoteAtOrAfter(seconds: number): number {
    const notes = this.song?.notes ?? []
    let low = 0
    let high = notes.length
    while (low < high) {
      const middle = Math.floor((low + high) / 2)
      if (notes[middle]!.startSeconds < seconds) low = middle + 1
      else high = middle
    }
    return low
  }

  private schedule() {
    if (!this.playing || !this.context || !this.song) return
    const horizon = this.context.currentTime + 0.7
    while (this.playing) {
      if (this.nextNoteIndex >= this.song.notes.length) {
        const nextLoop = this.anchorTime + this.song.durationSeconds
        if (nextLoop > horizon) break
        this.anchorTime = nextLoop
        this.nextNoteIndex = 0
        continue
      }

      const note = this.song.notes[this.nextNoteIndex]!
      const startAt = this.anchorTime + note.startSeconds
      if (startAt > horizon) break
      this.nextNoteIndex += 1
      if (startAt < this.context.currentTime - 0.03) continue
      this.scheduleNote(note, Math.max(startAt, this.context.currentTime + 0.005))
    }
  }

  private retainSource(source: AudioScheduledSourceNode) {
    const stop = () => {
      try {
        source.stop()
      } catch {
        // The voice may already have ended naturally.
      }
    }
    this.voiceStoppers.add(stop)
    source.addEventListener("ended", () => this.voiceStoppers.delete(stop), { once: true })
  }

  private scheduleNote(note: MidiNoteEvent, startAt: number) {
    if (!this.context || !this.output) return
    if (note.channel === 9) {
      this.scheduleDrum(note, startAt)
      return
    }

    const profile = synthProfile(note.program)
    const oscillator = this.context.createOscillator()
    const filter = this.context.createBiquadFilter()
    const gain = this.context.createGain()
    const velocity = Math.pow(note.velocity / 127, 1.45)
    const duration = Math.min(Math.max(note.durationSeconds, 0.035), 8)
    const attack = Math.min(profile.attack, duration * 0.45)
    const noteEnd = startAt + duration
    const stopAt = noteEnd + profile.release
    const peak = Math.max(0.0001, profile.level * velocity)

    oscillator.type = profile.wave
    oscillator.frequency.setValueAtTime(440 * Math.pow(2, (note.note - 69) / 12), startAt)
    filter.type = "lowpass"
    filter.frequency.setValueAtTime(profile.cutoff, startAt)
    filter.Q.value = 0.7
    gain.gain.setValueAtTime(0.0001, startAt)
    gain.gain.linearRampToValueAtTime(peak, startAt + attack)
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak * profile.sustain), noteEnd)
    gain.gain.exponentialRampToValueAtTime(0.0001, stopAt)

    oscillator.connect(filter)
    filter.connect(gain)
    gain.connect(this.output)
    this.retainSource(oscillator)
    oscillator.start(startAt)
    oscillator.stop(stopAt + 0.02)
  }

  private buildNoiseBuffer(): AudioBuffer {
    if (this.noiseBuffer) return this.noiseBuffer
    const context = this.context!
    const frameCount = Math.ceil(context.sampleRate * 0.6)
    const buffer = context.createBuffer(1, frameCount, context.sampleRate)
    const samples = buffer.getChannelData(0)
    let seed = 0x6d2b79f5
    for (let index = 0; index < samples.length; index += 1) {
      seed = Math.imul(seed ^ (seed >>> 15), seed | 1)
      seed ^= seed + Math.imul(seed ^ (seed >>> 7), seed | 61)
      samples[index] = (((seed ^ (seed >>> 14)) >>> 0) / 4294967296) * 2 - 1
    }
    this.noiseBuffer = buffer
    return buffer
  }

  private scheduleDrum(note: MidiNoteEvent, startAt: number) {
    const context = this.context!
    const output = this.output!
    const velocity = Math.pow(note.velocity / 127, 1.3)

    if (note.note === 35 || note.note === 36) {
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      oscillator.type = "sine"
      oscillator.frequency.setValueAtTime(125, startAt)
      oscillator.frequency.exponentialRampToValueAtTime(44, startAt + 0.16)
      gain.gain.setValueAtTime(0.11 * velocity, startAt)
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.19)
      oscillator.connect(gain)
      gain.connect(output)
      this.retainSource(oscillator)
      oscillator.start(startAt)
      oscillator.stop(startAt + 0.2)
      return
    }

    const source = context.createBufferSource()
    const filter = context.createBiquadFilter()
    const gain = context.createGain()
    const isHat = note.note === 42 || note.note === 44 || note.note === 46
    const isCymbal = note.note >= 49 && note.note <= 59
    const isSnare = note.note === 38 || note.note === 40
    const duration = isHat ? (note.note === 46 ? 0.16 : 0.055) : isCymbal ? 0.34 : 0.16
    const level = (isHat ? 0.035 : isCymbal ? 0.045 : isSnare ? 0.075 : 0.055) * velocity

    source.buffer = this.buildNoiseBuffer()
    filter.type = isHat || isCymbal ? "highpass" : "bandpass"
    filter.frequency.value = isHat || isCymbal ? 4_600 : isSnare ? 1_800 : 650
    filter.Q.value = isSnare ? 0.9 : 0.6
    gain.gain.setValueAtTime(Math.max(0.0001, level), startAt)
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration)
    source.connect(filter)
    filter.connect(gain)
    gain.connect(output)
    this.retainSource(source)
    source.start(startAt, 0, duration)
    source.stop(startAt + duration + 0.01)
  }
}
