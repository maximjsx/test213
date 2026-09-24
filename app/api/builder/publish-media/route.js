import { currentBuilderStatus } from '@/lib/builderAccess'
import { githubConfigured, commitFiles } from '@/lib/github'

export const dynamic = 'force-dynamic'

const ID = /^[\w-]+$/

function trackProblems(track) {
  if (!Array.isArray(track?.lines) || !track.lines.length) return ['The track has no lines.']
  const problems = []
  track.lines.forEach((l, i) => {
    if (typeof l.bg !== 'string' || !l.bg.trim()) problems.push(`Line ${i + 1} has no Bulgarian text.`)
    if (!(Number.isFinite(l.start) && Number.isFinite(l.end) && l.end > l.start)) problems.push(`Line ${i + 1} has invalid timing.`)
    if (i > 0 && l.start < track.lines[i - 1].start) problems.push(`Line ${i + 1} starts before line ${i}.`)
  })
  return problems
}

// POST { id, track }: commits data/media/<id>.json. Super-admin only.
export async function POST(req) {
  try {
    const status = await currentBuilderStatus()
    if (!status.isAdmin) return Response.json({ error: 'forbidden' }, { status: 403 })
    const { id, track } = await req.json()
    if (!ID.test(id || '')) return Response.json({ problems: ['Invalid media id.'] }, { status: 422 })
    const problems = trackProblems(track)
    if (problems.length) return Response.json({ problems }, { status: 422 })
    if (!githubConfigured()) return Response.json({ error: 'not_configured' }, { status: 503 })

    const content = JSON.stringify({ lines: track.lines, words: track.words || {} }, null, 2) + '\n'
    const url = await commitFiles([{ path: `data/media/${id}.json`, content }], `Update subtitles: ${id}`)
    return Response.json({ ok: true, url })
  } catch (e) {
    console.error('publish media error:', e)
    return Response.json({ error: 'publish_failed', message: e.message }, { status: 502 })
  }
}
