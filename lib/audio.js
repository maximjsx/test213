'use client'

// ─── TTS ──────────────────────────────────────────────────────────────────────
export function speakText(text) {
  if (!text || !/[Ѐ-ӿ]/.test(text)) return
  speakBulgarian(text)
}

export async function speakBulgarian(text) {
  if (typeof window === 'undefined') return
  // Single uppercase Cyrillic letter → TTS would say "главна буква А"; lowercase it
  const tts = (text.length === 1 && /[А-Я]/u.test(text)) ? text.toLowerCase() : text

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

    const data = await res.json()
    if (data.audioContent) {
      const audio = new Audio('data:audio/mp3;base64,' + data.audioContent)
      audio.play()
      return
    }
  } catch (e) {
    console.warn('TTS failed:', e)
  }

  // Fallback: browser built-in (free, infinite, but Bulgarian quality varies by OS)
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel()
    const utt = new SpeechSynthesisUtterance(tts)
    utt.lang = 'bg-BG'
    utt.rate = 0.85
    window.speechSynthesis.speak(utt)
  }
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

export function playCorrect()        { playSound('correct_answer.mp3', 0.8) }
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
