import { currentBuilderStatus } from '@/lib/builderAccess'
import { topicProblems, topicJson, registerTopic, unregisterTopic, registryFor, otherRegistry, specialMeta } from '@/lib/publishTopic'
import { githubConfigured, readFile, commitFiles } from '@/lib/github'
import { ALL_LEVELS } from '@/lib/serverCourse'
import { SPECIAL_LEVELS } from '@/data/special'

export const dynamic = 'force-dynamic'

// POST { level, dryRun? }
// Super-admin only: publishing commits to master and Vercel deploys it.
// dryRun checks the topic without committing, for the confirm dialog.
export async function POST(req) {
  try {
    const status = await currentBuilderStatus()
    if (!status.isAdmin) return Response.json({ error: 'forbidden' }, { status: 403 })

    const { level, dryRun } = await req.json()
    const problems = topicProblems(level, ALL_LEVELS)
    if (problems.length) return Response.json({ problems }, { status: 422 })

    const isNew = !ALL_LEVELS.some(l => l.id === level.id)
    if (dryRun) return Response.json({ ok: true, isNew, configured: githubConfigured() })
    if (!githubConfigured()) return Response.json({ error: 'not_configured' }, { status: 503 })

    const files = [{ path: `data/${level.id}.json`, content: topicJson(level) }]
    for (const [registry, change] of [
      [registryFor(level), s => registerTopic(s, level.id, registryFor(level))],
      [otherRegistry(level), s => unregisterTopic(s, level.id, otherRegistry(level))],
    ]) {
      const before = await readFile(registry.path)
      const after = change(before)
      if (after !== before) files.push({ path: registry.path, content: after })
    }
    // The browser's view of special topics is rebuilt from the full list
    const specials = [...SPECIAL_LEVELS.filter(l => l.id !== level.id), ...(level.special ? [level] : [])]
    files.push({ path: 'data/special-meta.json', content: JSON.stringify(specials.map(specialMeta), null, 2) + '\n' })

    const url = await commitFiles(files, `${isNew ? 'Add' : 'Update'} topic: ${level.title}`)
    return Response.json({ ok: true, isNew, url })
  } catch (e) {
    console.error('builder publish error:', e)
    return Response.json({ error: 'publish_failed', message: e.message }, { status: 502 })
  }
}
