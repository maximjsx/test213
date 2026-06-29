// Speech-to-text via Groq Whisper — used as fallback for iOS Safari where
// webkitSpeechRecognition doesn't support bg-BG offline.
// Requires GROQ_API_KEY env var (free tier at console.groq.com).
export async function POST(req) {
  try {
    const formData = await req.formData()
    const audio = formData.get('audio')
    if (!audio) return Response.json({ error: 'no audio' }, { status: 400 })

    const groqForm = new FormData()
    groqForm.append('file', audio, audio.name || 'recording.mp4')
    groqForm.append('model', 'whisper-large-v3')
    groqForm.append('language', 'bg')
    groqForm.append('response_format', 'json')

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
    return Response.json({ transcript: data.text ?? '' })
  } catch (e) {
    console.error('STT route error:', e)
    return Response.json({ error: 'internal_error' }, { status: 500 })
  }
}
