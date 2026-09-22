import { voiceoversCollection } from '@/lib/voiceovers'

export const dynamic = 'force-dynamic'

// Public: { map: { [voiceKey]: url } } of approved recordings, read by lib/audio on every page.
export async function GET() {
  try {
    const col = await voiceoversCollection()
    const docs = await col.find({ status: 'approved' }, { projection: { _id: 0, key: 1, url: 1 } }).toArray()
    const map = Object.fromEntries(docs.map(d => [d.key, d.url]))
    return Response.json({ map }, { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=600' } })
  } catch (e) {
    console.error('voiceovers GET error:', e)
    return Response.json({ map: {} }, { status: 500 })
  }
}
