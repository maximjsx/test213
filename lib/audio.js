'use client'

// ─── TTS MUTE ─────────────────────────────────────────────────────────────────
let _ttsMuted = false
if (typeof window !== 'undefined') {
  _ttsMuted = localStorage.getItem('tts_muted') === '1'
}
export function getTTSMuted() { return _ttsMuted }
export function setTTSMuted(val) {
  _ttsMuted = val
  try { localStorage.setItem('tts_muted', val ? '1' : '0') } catch {}
}

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

export async function speakBulgarian(text, voice) {
  if (typeof window === 'undefined') return 0
  if (_ttsMuted) return 0
  const isSingleCyrillic = text.length === 1 && /[Ѐ-ӿ]/i.test(text)
  const tts = isSingleCyrillic ? letterToSpeechText(text) : text
  const v = voice || 'bg-BG-Chirp3-HD-Aoede'
  const cacheKey = v + '|' + tts

  // 1. In-memory hit — zero latency
  if (_audioCache.has(cacheKey)) {
    return await playAudioBuffer(_audioCache.get(cacheKey))
  }

  // 2. localStorage hit — zero network, instant even after page reload
  const stored = lsGet(cacheKey)
  if (stored) {
    _audioCache.set(cacheKey, stored)
    return await playAudioBuffer(stored)
  }

  // 3. Server route checks quota + calls Google TTS with hidden key
  try {
    const res = await fetch('/api/tts-usage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: tts, voice: v }),
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
      _audioCache.set(cacheKey, data.audioContent)
      lsSet(cacheKey, data.audioContent)
      return await playAudioBuffer(data.audioContent)
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

// ─── CUSTOM AUDIO CLIPS (uploaded files served by storage-api) ────────────────
// Play a hosted audio file by URL. Resolves with the clip duration in ms (as soon
// as metadata loads) so callers like Dialog can schedule the next line, while
// playback continues. Matches speakBulgarian's "return duration, keep playing"
// contract. Returns 0 if muted, unknown, or on error.
export function playAudioUrl(url) {
  if (typeof window === 'undefined' || !url) return Promise.resolve(0)
  if (_ttsMuted) return Promise.resolve(0)
  // Stop any overlapping playback (both AudioContext buffers and <audio> elements)
  if (_currentSource) { try { _currentSource.stop() } catch (_) {} _currentSource = null }
  stopCurrentEl()
  return new Promise(resolve => {
    let settled = false
    const done = ms => { if (!settled) { settled = true; resolve(ms || 0) } }
    const a = new Audio()
    a.preload = 'auto'
    _currentAudioEl = a
    a.addEventListener('loadedmetadata', () => done(isFinite(a.duration) ? Math.round(a.duration * 1000) : 0))
    a.addEventListener('ended', () => { if (_currentAudioEl === a) _currentAudioEl = null })
    a.addEventListener('error', () => done(0))
    a.src = url
    a.play().catch(() => done(0))
    // Safety net if metadata never loads
    setTimeout(() => done(0), 4000)
  })
}

// Unified: play a custom uploaded clip if one exists, otherwise fall back to TTS.
// `audio` is an optional { url } (or falsy), `text`/`voice` drive the TTS fallback.
export function playClip({ audio, text, voice } = {}) {
  if (audio && audio.url) return playAudioUrl(audio.url)
  return speakBulgarian(text, voice)
}

// Like playClip, but the promise resolves only when playback has actually FINISHED
// (returns elapsed ms). Use this where the caller must wait for the whole clip —
// e.g. Dialog playing lines back-to-back. We can't trust a clip's metadata
// duration (MediaRecorder webm reports Infinity), so for URLs we wait on 'ended'.
export function playClipBlocking({ audio, text, voice } = {}) {
  if (audio && audio.url) return playUrlUntilEnded(audio.url)
  // TTS path: speakBulgarian returns the exact decoded duration and keeps playing.
  return speakBulgarian(text, voice).then(async duration => {
    if (duration > 0) await new Promise(r => setTimeout(r, duration))
    return duration
  })
}

function playUrlUntilEnded(url) {
  if (typeof window === 'undefined' || !url) return Promise.resolve(0)
  if (_ttsMuted) return Promise.resolve(0)
  if (_currentSource) { try { _currentSource.stop() } catch (_) {} _currentSource = null }
  stopCurrentEl()
  return new Promise(resolve => {
    let settled = false
    const start = Date.now()
    const done = ms => { if (!settled) { settled = true; resolve(ms || 0) } }
    const a = new Audio()
    a.preload = 'auto'
    _currentAudioEl = a
    a.addEventListener('ended', () => { if (_currentAudioEl === a) _currentAudioEl = null; done(Date.now() - start) })
    a.addEventListener('error', () => done(0))
    a.src = url
    a.play().catch(() => done(0))
    // Safety cap so a stuck clip can't freeze a dialog forever
    setTimeout(() => done(Date.now() - start), 20000)
  })
}

// ─── AUDIO CONTEXT (stays unlocked once resumed on a user gesture) ────────────
let _ctx = null
let _currentSource = null
let _currentAudioEl = null

function stopCurrentEl() {
  if (_currentAudioEl) {
    try { _currentAudioEl.pause() } catch (_) {}
    _currentAudioEl = null
  }
}

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

// Returns duration of the played audio in ms, or 0 if unknown.
async function playAudioBuffer(base64) {
  // Stop any overlapping playback
  if (_currentSource) {
    try { _currentSource.stop() } catch (_) {}
    _currentSource = null
  }
  stopCurrentEl()

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
        return 0
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
        return Math.round(decoded.duration * 1000)
      } catch (_) {}
    }
  }
  // Last-resort fallback
  new Audio('data:audio/mp3;base64,' + base64).play().catch(() => {})
  return 0
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
export function startSpeechRecognition(onResult, onEnd, onError, lang = 'bg-BG') {
  if (typeof window === 'undefined') return null
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SR) return null
  const rec = new SR()
  rec.lang = lang
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
