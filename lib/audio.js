'use client'

// ─── TTS ──────────────────────────────────────────────────────────────────────
export function speakText(text) {
  if (!text || !/[Ѐ-ӿ]/.test(text)) return
  speakBulgarian(text)
}

// Single Cyrillic letters sent bare cause TTS to say the letter name ("главна буква А").
// Vowels → repeat triple so TTS produces the vowel sound.
// Consonants → append "а" to form a syllable ("ба", "ва", etc.).
const BG_VOWELS = new Set('аеиоуъюя')
function letterToSpeechText(letter) {
  const l = letter.toLowerCase()
  return BG_VOWELS.has(l) ? `${l} ${l} ${l}` : `${l}а`
}

export async function speakBulgarian(text) {
  if (typeof window === 'undefined') return
  const isSingleCyrillic = text.length === 1 && /[Ѐ-ӿ]/i.test(text)
  const tts = isSingleCyrillic ? letterToSpeechText(text) : text

  // Server route checks quota + calls Google TTS with hidden key
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
      console.warn('TTS server error:', res.status)
      throw new Error(`TTS HTTP ${res.status}`)
    }

    const data = await res.json()
    if (data.audioContent) {
      // Use AudioContext so playback works even after async fetch (no gesture required
      // once AudioContext was resumed on the initial user tap via unlockAudio())
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
  const ctx = getCtx()
  if (ctx) {
    if (ctx.state === 'suspended') await ctx.resume()
    try {
      const bin = atob(base64)
      const buf = new Uint8Array(bin.length)
      for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i)
      const decoded = await ctx.decodeAudioData(buf.buffer)
      const src = ctx.createBufferSource()
      src.buffer = decoded
      src.connect(ctx.destination)
      src.start()
      return
    } catch (_) {}
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
export function startSpeechRecognition(onResult, onEnd) {
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
  rec.start()
  return rec
}
