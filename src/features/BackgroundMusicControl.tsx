import { useEffect, useRef, useState } from "react"
import { MidiMusicPlayer } from "../audio/midiPlayer"
import { useLocalization } from "../i18n/localization"
import { musicCopy } from "../i18n/musicCopy"

interface MusicPlayer {
  dispose: () => void
  pause: () => void
  play: () => Promise<boolean>
}

type MusicStatus = "error" | "loading" | "off" | "playing"

export function BackgroundMusicControl({
  blocked = false,
  createPlayer = () => new MidiMusicPlayer("/music/the-golden-dragon.mid"),
}: {
  blocked?: boolean
  createPlayer?: () => MusicPlayer
}) {
  const { locale } = useLocalization()
  const copy = musicCopy[locale]
  const player = useRef<MusicPlayer | undefined>(undefined)
  const request = useRef(0)
  const [status, setStatus] = useState<MusicStatus>("off")

  const currentPlayer = () => {
    player.current ??= createPlayer()
    return player.current
  }

  useEffect(() => {
    if (!blocked) return
    request.current += 1
    player.current?.pause()
    setStatus("off")
  }, [blocked])

  useEffect(() => () => {
    request.current += 1
    player.current?.dispose()
  }, [])

  const toggle = async () => {
    if (blocked || status === "loading") return
    const musicPlayer = currentPlayer()
    if (status === "playing") {
      request.current += 1
      musicPlayer.pause()
      setStatus("off")
      return
    }

    const requestId = ++request.current
    setStatus("loading")
    try {
      const started = await musicPlayer.play()
      if (request.current !== requestId) return
      setStatus(started ? "playing" : "off")
    } catch {
      if (request.current === requestId) setStatus("error")
    }
  }

  const label = blocked
    ? copy.blocked
    : status === "playing"
      ? copy.pause
      : status === "loading"
        ? copy.loading
        : status === "error"
          ? copy.error
          : copy.play

  return (
    <button
      aria-label={label}
      aria-pressed={status === "playing"}
      className="music-toggle"
      data-music-status={blocked ? "blocked" : status}
      disabled={blocked || status === "loading"}
      onClick={() => void toggle()}
      title={label}
      type="button"
    >
      <span aria-hidden="true" className="music-toggle-note">
        {status === "loading" ? "…" : status === "playing" ? "♫" : "♪"}
      </span>
      {status === "playing" && <span aria-hidden="true" className="music-toggle-pulse" />}
    </button>
  )
}
