import getClientPromise from '@/lib/mongodb'

const MONTHLY_LIMIT = 1_000_000

function currentMonth() {
  return new Date().toISOString().slice(0, 7) // "2026-06"
}

// POST { text: string } — check quota, call Google TTS, return audioContent
export async function POST(req) {
  const { text } = await req.json()
  if (!text) return Response.json({ error: 'no text' }, { status: 400 })

  const chars = text.length
  const client = await getClientPromise()
  const col = client.db('bulgario').collection('tts_usage')
  const month = currentMonth()

  // Atomically reserve quota — only increments if still under limit
  const result = await col.findOneAndUpdate(
    { month, chars: { $lte: MONTHLY_LIMIT - chars } },
    { $inc: { chars } },
    { upsert: true, returnDocument: 'after' }
  )

  if (!result) {
    const doc = await col.findOne({ month })
    return Response.json({ error: 'limit_reached', used: doc?.chars ?? MONTHLY_LIMIT }, { status: 429 })
  }

  // Call Google TTS server-side (key never sent to browser)
  const ttsRes = await fetch(
    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${process.env.GOOGLE_TTS_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { text },
        voice: { languageCode: 'bg-BG', name: 'bg-BG-Chirp3-HD-Aoede' },
        audioConfig: { audioEncoding: 'MP3', speakingRate: 0.85 },
      }),
    }
  )
  const ttsData = await ttsRes.json()

  if (!ttsData.audioContent) {
    // Roll back the quota increment since TTS failed
    await col.updateOne({ month }, { $inc: { chars: -chars } })
    return Response.json({ error: 'tts_failed' }, { status: 502 })
  }

  return Response.json({ audioContent: ttsData.audioContent, used: result.chars })
}

// GET — return current month's usage
export async function GET() {
  const client = await getClientPromise()
  const col = client.db('bulgario').collection('tts_usage')
  const doc = await col.findOne({ month: currentMonth() })
  return Response.json({ used: doc?.chars ?? 0, limit: MONTHLY_LIMIT })
}
