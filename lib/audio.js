'use client'

// ─── TTS ──────────────────────────────────────────────────────────────────────
export function speakText(text) {
  if (!text || !/[Ѐ-ӿ]/.test(text)) return
  speakBulgarian(text)
}

// Single Cyrillic letters sent bare cause TTS to say the letter name ("главна буква А").
// Vowels → send lowercase so TTS pronounces the sound, not the letter name.
// Consonants → append "ъ" to form a syllable ("бъ", "въ", etc.).
const BG_VOWELS = new Set('аеиоуъюя')
function letterToSpeechText(letter) {
  const l = letter.toLowerCase()
  return BG_VOWELS.has(l) ? l : `${l}ъ`
}

// Hot cache for the current session (Map) + persistent cache across sessions (localStorage).
// Words heard before play instantly with zero network calls.
const _audioCache = new Map()
const LS_PREFIX = 'tts_v1_'

function lsGet(key) {
  try { return localStorage.getItem(LS_PREFIX + key) } catch { return null }
}
function lsSet(key, audio) {
  try { localStorage.setItem(LS_PREFIX + key, audio) } catch {} // ignore QuotaExceededError
}

export async function speakBulgarian(text) {
  if (typeof window === 'undefined') return
  const isSingleCyrillic = text.length === 1 && /[Ѐ-ӿ]/i.test(text)
  const tts = isSingleCyrillic ? letterToSpeechText(text) : text

  // 1. In-memory hit — zero latency
  if (_audioCache.has(tts)) {
    await playAudioBuffer(_audioCache.get(tts))
    return
  }

  // 2. localStorage hit — zero network, instant even after page reload
  const stored = lsGet(tts)
  if (stored) {
    _audioCache.set(tts, stored)
    await playAudioBuffer(stored)
    return
  }

  // 3. Server route checks quota + calls Google TTS with hidden key
  try {
    const res = await fetch('/api/tts-usage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: tts }),
    })

    if (res.status === 429) {
      console.warn('TTS monthly limit reached — audio disabled until next month')
      return
    }

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}))
      console.warn('TTS server error:', res.status, errBody)
      throw new Error(`TTS HTTP ${res.status}`)
    }

    const data = await res.json()
    if (data.audioContent) {
      _audioCache.set(tts, data.audioContent)
      lsSet(tts, data.audioContent)
      await playAudioBuffer(data.audioContent)
      return
    }
  } catch (e) {
    console.warn('TTS failed:', e)
  }

  // Fallback: browser built-in
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel()
    const utt = new SpeechSynthesisUtterance(tts)
    utt.lang = 'bg-BG'
    utt.rate = 0.85
    window.speechSynthesis.speak(utt)
  }
}

// ─── AUDIO CONTEXT (stays unlocked once resumed on a user gesture) ────────────
let _ctx = null
let _currentSource = null

function getCtx() {
  if (!_ctx && typeof window !== 'undefined') {
    const Ctor = window.AudioContext || window.webkitAudioContext
    if (Ctor) _ctx = new Ctor()
  }
  return _ctx
}

// Call this inside any click/pointer handler so AudioContext becomes 'running'.
// After that, async audio plays work without further gestures.
export function unlockAudio() {
  if (typeof window === 'undefined') return
  const ctx = getCtx()
  if (ctx && ctx.state !== 'running') ctx.resume()
}

async function playAudioBuffer(base64) {
  // Stop any overlapping playback
  if (_currentSource) {
    try { _currentSource.stop() } catch (_) {}
    _currentSource = null
  }

  const ctx = getCtx()
  if (ctx) {
    // Mobile browsers suspend (and iOS can 'interrupt') the AudioContext when the
    // screen locks or the app backgrounds. Resume with a 500ms timeout — if it
    // doesn't come back in time, fall through to the Audio element fallback.
    if (ctx.state === 'suspended' || ctx.state === 'interrupted') {
      try {
        await Promise.race([
          ctx.resume(),
          new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 500)),
        ])
      } catch (_) {
        new Audio('data:audio/mp3;base64,' + base64).play().catch(() => {})
        return
      }
    }
    if (ctx.state === 'running') {
      try {
        const bin = atob(base64)
        const buf = new Uint8Array(bin.length)
        for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i)
        const decoded = await ctx.decodeAudioData(buf.buffer)
        const src = ctx.createBufferSource()
        src.buffer = decoded
        src.connect(ctx.destination)
        _currentSource = src
        src.onended = () => { if (_currentSource === src) _currentSource = null }
        src.start()
        return
      } catch (_) {}
    }
  }
  // Last-resort fallback
  new Audio('data:audio/mp3;base64,' + base64).play().catch(() => {})
}

// ─── SOUND FX (mp3 files from /public/sounds) ─────────────────────────────────
function playSound(file, volume = 1) {
  if (typeof window === 'undefined') return
  try {
    const audio = new Audio(`/sounds/${file}`)
    audio.volume = volume
    audio.play().catch(() => {})
  } catch (e) {}
}

export function playCorrect()        { playSound('correct_answer.mp3', 1.0) }
export function playWrong()          { playSound('wrong_answer.mp3', 0.8) }
export function playLevelComplete()  { playSound('lesson_done.mp3', 0.9) }
export function playPerfect()        { playSound('perfect_lesson_done.mp3', 0.9) }
export function playAllHeartsLost()  { playSound('all_hearts_lost.mp3', 0.9) }

// ─── HAPTICS (Android only — iOS Safari does not support navigator.vibrate) ───
export function hapticTap()    { navigator.vibrate?.(18) }
export function hapticCorrect(){ navigator.vibrate?.(25) }
export function hapticWrong()  { navigator.vibrate?.([40, 60, 40]) }

// ─── SPEECH RECOGNITION ───────────────────────────────────────────────────────
export function startSpeechRecognition(onResult, onEnd, onError) {
  if (typeof window === 'undefined') return null
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SR) return null
  const rec = new SR()
  rec.lang = 'bg-BG'
  rec.interimResults = false
  rec.maxAlternatives = 3
  rec.onresult = (e) => {
    const results = Array.from(e.results[0]).map(r => r.transcript)
    onResult(results[0], results)
  }
  rec.onend = onEnd
  rec.onerror = (e) => {
    if (onError) onError(e.error)
  }
  rec.start()
  return rec
}
