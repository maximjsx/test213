const BASE = 'https://asr.api.speechmatics.com/v2'

export async function POST(req) {
  try {
    const formData = await req.formData()
    const audio = formData.get('audio')
    if (!audio) return Response.json({ error: 'no audio' }, { status: 400 })

    const key = process.env.SPEECHMATICS_API_KEY
    if (!key) return Response.json({ error: 'SPEECHMATICS_API_KEY not set' }, { status: 500 })

    const headers = { Authorization: `Bearer ${key}` }

    const audioBuffer = await audio.arrayBuffer()
    const rawType = audio.type || 'audio/mp4'
    // Strip codec params — Speechmatics rejects "audio/webm; codecs=opus", needs plain "audio/webm"
    const audioType = rawType.split(';')[0].trim()
    const fileName = audio.name || 'recording.mp4'

    const audioFile = new File([audioBuffer], fileName, { type: audioType })

    const debug = {
      fileName,
      audioType,
      rawType,
      audioSize: audioBuffer.byteLength,
    }

    // 1. Submit job
    const jobForm = new FormData()
    jobForm.append('data_file', audioFile, fileName)
    jobForm.append('config', JSON.stringify({
      type: 'transcription',
      transcription_config: { language: 'bg' },
    }))

    const submitRes = await fetch(`${BASE}/jobs/`, { method: 'POST', headers, body: jobForm })
    if (!submitRes.ok) {
      const errBody = await submitRes.text().catch(() => '')
      let errParsed
      try { errParsed = JSON.parse(errBody) } catch { errParsed = errBody }
      console.error('Speechmatics submit error:', submitRes.status, errBody)
      return Response.json({
        error: 'submit_failed',
        speechmatics_status: submitRes.status,
        speechmatics_error: errParsed,
        debug,
      }, { status: 502 })
    }

    const submitData = await submitRes.json()
    const jobId = submitData.id
    debug.jobId = jobId

    // 2. Poll until done (max 20s)
    const deadline = Date.now() + 20_000
    let lastStatus = null
    while (Date.now() < deadline) {
      await new Promise(r => setTimeout(r, 700))
      const statusRes = await fetch(`${BASE}/jobs/${jobId}`, { headers })
      if (!statusRes.ok) break
      const { job } = await statusRes.json()
      lastStatus = job.status
      if (job.status === 'done') break
      if (job.status === 'rejected' || job.status === 'deleted') {
        return Response.json({ error: 'job_failed', job_status: job.status, debug }, { status: 502 })
      }
    }

    if (lastStatus !== 'done') {
      return Response.json({ error: 'timeout', last_status: lastStatus, debug }, { status: 502 })
    }

    // 3. Fetch transcript
    const txRes = await fetch(`${BASE}/jobs/${jobId}/transcript?format=json-v2`, { headers })
    if (!txRes.ok) {
      const errBody = await txRes.text().catch(() => '')
      return Response.json({ error: 'transcript_failed', speechmatics_status: txRes.status, speechmatics_error: errBody, debug }, { status: 502 })
    }

    const tx = await txRes.json()
    const words = (tx.results ?? [])
      .filter(r => r.type === 'word')
      .map(r => r.alternatives?.[0]?.content ?? '')
      .filter(Boolean)

    const transcript = words.join(' ')
    return Response.json({ transcript, debug })
  } catch (e) {
    console.error('Speechmatics route error:', e)
    return Response.json({ error: 'internal_error', message: e.message }, { status: 500 })
  }
}
