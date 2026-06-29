// Speech-to-text via Groq Whisper — used as fallback for iOS Safari where
// webkitSpeechRecognition doesn't support bg-BG offline.
// Requires GROQ_API_KEY env var (free tier at console.groq.com).

// Words below this average confidence are treated as unreliable transcriptions.
const CONFIDENCE_THRESHOLD = 0.6

export async function POST(req) {
  try {
    const formData = await req.formData()
    const audio = formData.get('audio')
    const target = formData.get('target') || ''
    if (!audio) return Response.json({ error: 'no audio' }, { status: 400 })

    const groqForm = new FormData()
    groqForm.append('file', audio, audio.name || 'recording.mp4')
    groqForm.append('model', 'whisper-large-v3')
    groqForm.append('language', 'bg')
    groqForm.append('response_format', 'verbose_json')
    groqForm.append('temperature', '0.1')
    if (target) groqForm.append('prompt', target)

    const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: groqForm,
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      console.error('Groq STT error:', res.status, err)
      return Response.json({ error: 'stt_failed' }, { status: 502 })
    }

    const data = await res.json()
    const transcript = data.text ?? ''

    // Use word-level confidence from verbose_json to detect low-quality transcriptions.
    // If average confidence is too low, return empty so the user is asked to retry.
    const words = data.segments?.flatMap(s => s.words ?? []) ?? []
    if (words.length > 0) {
      const avgConf = words.reduce((sum, w) => sum + (w.probability ?? 1), 0) / words.length
      if (avgConf < CONFIDENCE_THRESHOLD) {
        console.log(`STT low confidence (${avgConf.toFixed(2)}), discarding: "${transcript}"`)
        return Response.json({ transcript: '', confidence: avgConf })
      }
    }

    return Response.json({ transcript, confidence: words.length > 0
      ? words.reduce((sum, w) => sum + (w.probability ?? 1), 0) / words.length
      : null
    })
  } catch (e) {
    console.error('STT route error:', e)
    return Response.json({ error: 'internal_error' }, { status: 500 })
  }
}
