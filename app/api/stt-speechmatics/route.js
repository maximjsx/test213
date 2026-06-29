import { WebSocket } from 'ws'

export const runtime = 'nodejs'

const RT_URL = 'wss://eu.rt.speechmatics.com/v2'

export async function POST(req) {
  try {
    const formData = await req.formData()
    const audio = formData.get('audio')
    if (!audio) return Response.json({ error: 'no audio' }, { status: 400 })

    const key = process.env.SPEECHMATICS_API_KEY
    if (!key) return Response.json({ error: 'SPEECHMATICS_API_KEY not set' }, { status: 500 })

    const sampleRate = parseInt(formData.get('sample_rate') || '44100')
    const pcmBuffer = Buffer.from(await audio.arrayBuffer())

    return new Promise((resolve) => {
      const ws = new WebSocket(RT_URL, { headers: { Authorization: `Bearer ${key}` } })

      let transcript = ''
      let seqNo = 0
      let settled = false

      function finish(res) {
        if (settled) return
        settled = true
        try { ws.close() } catch {}
        resolve(res)
      }

      const timeout = setTimeout(() => {
        finish(Response.json({ transcript: transcript.trim(), warning: 'timeout' }))
      }, 20000)

      ws.on('open', () => {
        ws.send(JSON.stringify({
          message: 'StartRecognition',
          audio_format: { type: 'raw', encoding: 'pcm_s16le', sample_rate: sampleRate },
          transcription_config: {
            language: 'bg',
            max_delay: 2.0,
            max_delay_mode: 'flexible',
            enable_partials: false,
          },
        }))
      })

      ws.on('message', (data) => {
        let msg
        try { msg = JSON.parse(data.toString()) } catch { return }

        if (msg.message === 'RecognitionStarted') {
          // Stream PCM in 8KB chunks
          const CHUNK = 8192
          let offset = 0
          while (offset < pcmBuffer.length) {
            ws.send(pcmBuffer.slice(offset, offset + CHUNK))
            offset += CHUNK
            seqNo++
          }
          ws.send(JSON.stringify({ message: 'EndOfStream', last_seq_no: seqNo }))
        }

        if (msg.message === 'AddTranscript' && msg.metadata?.transcript) {
          transcript += (transcript ? ' ' : '') + msg.metadata.transcript.trim()
        }

        if (msg.message === 'EndOfTranscript') {
          clearTimeout(timeout)
          finish(Response.json({ transcript: transcript.trim() }))
        }

        if (msg.message === 'Error') {
          clearTimeout(timeout)
          finish(Response.json({ error: msg.reason || 'speechmatics_error', detail: msg }, { status: 502 }))
        }
      })

      ws.on('error', (err) => {
        clearTimeout(timeout)
        finish(Response.json({ error: 'websocket_error', message: err.message }, { status: 502 }))
      })

      ws.on('close', () => {
        clearTimeout(timeout)
        finish(Response.json({ transcript: transcript.trim() }))
      })
    })
  } catch (e) {
    console.error('Speechmatics RT error:', e)
    return Response.json({ error: 'internal_error', message: e.message }, { status: 500 })
  }
}
