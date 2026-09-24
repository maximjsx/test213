'use client'
import { useCallback, useEffect, useRef, useState } from 'react'

const POLL_MS = 200
let apiReady = null
function loadApi() {
  apiReady ??= new Promise(resolve => {
    if (window.YT?.Player) return resolve(window.YT)
    const previous = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => { previous?.(); resolve(window.YT) }
    const script = document.createElement('script')
    script.src = 'https://www.youtube.com/iframe_api'
    document.head.appendChild(script)
  })
  return apiReady
}

// YouTube IFrame player with the current time polled while it plays (the
// API has no time event). 5 times a second is enough to highlight lines and
// loop them without re-rendering the page every frame. Returns a ref for the mount
// element plus controls.
export function useYouTubePlayer(videoId) {
  const mountRef = useRef(null)
  const playerRef = useRef(null)
  const [ready, setReady] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)

  useEffect(() => {
    let cancelled = false
    loadApi().then(YT => {
      if (cancelled || !mountRef.current) return
      playerRef.current = new YT.Player(mountRef.current, {
        videoId,
        host: 'https://www.youtube-nocookie.com',
        playerVars: { rel: 0, playsinline: 1, cc_load_policy: 0, iv_load_policy: 3 },
        events: {
          onReady: () => setReady(true),
          onStateChange: e => setPlaying(e.data === YT.PlayerState.PLAYING),
        },
      })
    })
    return () => {
      cancelled = true
      playerRef.current?.destroy?.()
      playerRef.current = null
      setReady(false)
    }
  }, [videoId])

  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => setTime(playerRef.current?.getCurrentTime?.() ?? 0), POLL_MS)
    return () => clearInterval(id)
  }, [playing])

  const seek = useCallback((seconds, play = true) => {
    const p = playerRef.current
    if (!p) return
    p.seekTo(seconds, true)
    setTime(seconds)
    if (play) p.playVideo()
  }, [])
  const play = useCallback(() => playerRef.current?.playVideo(), [])
  const pause = useCallback(() => playerRef.current?.pauseVideo(), [])
  const setRate = useCallback(rate => playerRef.current?.setPlaybackRate(rate), [])

  return { mountRef, ready, playing, time, seek, play, pause, setRate }
}
