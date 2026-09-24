import { currentBuilderStatus } from '@/lib/builderAccess'
import { topicProblems, topicJson, registerTopic } from '@/lib/publishTopic'
import { githubConfigured, readFile, commitFiles } from '@/lib/github'
import { LEVELS } from '@/lib/course'

export const dynamic = 'force-dynamic'

// POST { level, dryRun? }
// Super-admin only: publishing commits to master and Vercel deploys it.
// dryRun checks the topic without committing, for the confirm dialog.
export async function POST(req) {
  try {
    const status = await currentBuilderStatus()
    if (!status.isAdmin) return Response.json({ error: 'forbidden' }, { status: 403 })

    const { level, dryRun } = await req.json()
    const problems = topicProblems(level, LEVELS)
    if (problems.length) return Response.json({ problems }, { status: 422 })

    const isNew = !LEVELS.some(l => l.id === level.id)
    if (dryRun) return Response.json({ ok: true, isNew, configured: githubConfigured() })
    if (!githubConfigured()) return Response.json({ error: 'not_configured' }, { status: 503 })

    const course = await readFile('data/course.js')
    const files = [{ path: `data/${level.id}.json`, content: topicJson(level) }]
    const registered = registerTopic(course, level.id)
    if (registered !== course) files.push({ path: 'data/course.js', content: registered })

    const url = await commitFiles(files, `${isNew ? 'Add' : 'Update'} topic: ${level.title}`)
    return Response.json({ ok: true, isNew, url })
  } catch (e) {
    console.error('builder publish error:', e)
    return Response.json({ error: 'publish_failed', message: e.message }, { status: 502 })
  }
}
