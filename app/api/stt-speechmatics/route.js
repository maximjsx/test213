const BASE = 'https://asr.api.speechmatics.com/v2'

export async function POST(req) {
  try {
    const formData = await req.formData()
    const audio = formData.get('audio')
    if (!audio) return Response.json({ error: 'no audio' }, { status: 400 })

    const key = process.env.SPEECHMATICS_API_KEY
    const headers = { Authorization: `Bearer ${key}` }

    // Re-buffer the audio to ensure clean bytes and correct content-type
    const audioBuffer = await audio.arrayBuffer()
    const audioBlob = new Blob([audioBuffer], { type: audio.type || 'audio/mp4' })
    const fileName = audio.name || 'recording.mp4'

    // 1. Submit job
    const jobForm = new FormData()
    jobForm.append('data_file', audioBlob, fileName)
    jobForm.append('config', JSON.stringify({
      type: 'transcription',
      transcription_config: { language: 'bg' },
    }))

    const submitRes = await fetch(`${BASE}/jobs/`, { method: 'POST', headers, body: jobForm })
    if (!submitRes.ok) {
      const errBody = await submitRes.text().catch(() => '')
      console.error('Speechmatics submit error:', submitRes.status, errBody)
      return Response.json({ error: 'submit_failed' }, { status: 502 })
    }
    const { id: jobId } = await submitRes.json()

    // 2. Poll until done (max 20s)
    const deadline = Date.now() + 20_000
    while (Date.now() < deadline) {
      await new Promise(r => setTimeout(r, 700))
      const statusRes = await fetch(`${BASE}/jobs/${jobId}`, { headers })
      if (!statusRes.ok) break
      const { job } = await statusRes.json()
      if (job.status === 'done') break
      if (job.status === 'rejected' || job.status === 'deleted') {
        return Response.json({ error: 'job_failed' }, { status: 502 })
      }
    }

    // 3. Fetch transcript (json-v2 gives word-level results)
    const txRes = await fetch(`${BASE}/jobs/${jobId}/transcript?format=json-v2`, { headers })
    if (!txRes.ok) return Response.json({ error: 'transcript_failed' }, { status: 502 })

    const tx = await txRes.json()
    const words = (tx.results ?? [])
      .filter(r => r.type === 'word')
      .map(r => r.alternatives?.[0]?.content ?? '')
      .filter(Boolean)

    const transcript = words.join(' ')
    return Response.json({ transcript })
  } catch (e) {
    console.error('Speechmatics route error:', e)
    return Response.json({ error: 'internal_error' }, { status: 500 })
  }
}
