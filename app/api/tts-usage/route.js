import getClientPromise from '@/lib/mongodb'

const MONTHLY_LIMIT = 1_000_000

function currentMonth() {
  return new Date().toISOString().slice(0, 7) // "2026-06"
}

// POST { text: string } — check quota, call Google TTS, return audioContent
export async function POST(req) {
  try {
    const { text, voice } = await req.json()
    if (!text) return Response.json({ error: 'no text' }, { status: 400 })
    const voiceName = voice || 'bg-BG-Chirp3-HD-Aoede'

    const client = await getClientPromise()
    const db = client.db('bulgario')

    // Cache hit — skip quota increment and Google TTS call entirely
    const cached = await db.collection('tts_cache').findOne({ text, voice: voiceName }, { projection: { audio: 1 } })
    if (cached?.audio) {
      return Response.json({ audioContent: cached.audio })
    }

    const chars = text.length
    const month = currentMonth()

    // Single atomic upsert — increment first, then verify under limit
    const result = await db.collection('tts_usage').findOneAndUpdate(
      { month },
      { $inc: { chars }, $setOnInsert: { month } },
      { upsert: true, returnDocument: 'after' }
    )

    if (result.chars > MONTHLY_LIMIT) {
      await db.collection('tts_usage').updateOne({ month }, { $inc: { chars: -chars } })
      return Response.json({ error: 'limit_reached', used: result.chars }, { status: 429 })
    }

    const ttsRes = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${process.env.GOOGLE_TTS_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { text },
          voice: { languageCode: 'bg-BG', name: voiceName },
          audioConfig: { audioEncoding: 'MP3', speakingRate: 0.85 },
        }),
      }
    )
    const ttsData = await ttsRes.json()

    if (!ttsData.audioContent) {
      await db.collection('tts_usage').updateOne({ month }, { $inc: { chars: -chars } })
      return Response.json({ error: 'tts_failed', detail: ttsData.error?.message }, { status: 502 })
    }

    // Cache audio for future requests (fire-and-forget — don't delay response)
    db.collection('tts_cache')
      .updateOne({ text, voice: voiceName }, { $set: { text, voice: voiceName, audio: ttsData.audioContent } }, { upsert: true })
      .catch(() => {})

    return Response.json({ audioContent: ttsData.audioContent, used: result.chars })
  } catch (e) {
    console.error('TTS route error:', e)
    return Response.json({ error: 'internal_error', detail: e.message }, { status: 500 })
  }
}

// GET — return current month's usage
export async function GET() {
  const client = await getClientPromise()
  const col = client.db('bulgario').collection('tts_usage')
  const doc = await col.findOne({ month: currentMonth() })
  return Response.json({ used: doc?.chars ?? 0, limit: MONTHLY_LIMIT })
}
