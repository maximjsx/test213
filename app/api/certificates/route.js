import { getSession, baseUrl } from '@/lib/auth'
import { certificateProgress, findCertificate } from '@/lib/certificates'
import { canRender } from '@/lib/certificatePdf'
import { certificatesCollection, issueCertificate, publicCertificate, userProgressLessons } from '@/lib/certificateStore'

export const dynamic = 'force-dynamic'

const NAME_PATTERN = /^\p{L}[\p{L}\p{M}' .-]*$/u

function cleanName(raw) {
  const name = String(raw || '').replace(/\s+/g, ' ').trim()
  if (name.length < 2 || name.length > 60) return null
  if (!NAME_PATTERN.test(name) || !canRender(name)) return null
  return name
}

// The signed-in user's certificates
export async function GET() {
  const session = getSession()
  if (!session) return Response.json({ certificates: [] })

  const col = await certificatesCollection()
  const docs = await col.find({ discordId: session.discordId }, { projection: { pdf: 0, token: 0 } }).toArray()
  return Response.json({ certificates: docs.map(publicCertificate) })
}

// Claim a certificate. One per tier per account; claiming again returns the first one.
export async function POST(req) {
  try {
    const session = getSession()
    if (!session) return Response.json({ error: 'unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const tier = findCertificate(body.tier)
    if (!tier) return Response.json({ error: 'unknown_certificate' }, { status: 400 })

    const col = await certificatesCollection()
    const existing = await col.findOne({ discordId: session.discordId, tier: tier.id }, { projection: { pdf: 0, token: 0 } })
    if (existing) return Response.json({ certificate: publicCertificate(existing) })

    const name = cleanName(body.name)
    if (!name) return Response.json({ error: 'invalid_name' }, { status: 400 })

    const lessons = await userProgressLessons(session.discordId)
    if (!certificateProgress(tier, lessons).complete) {
      return Response.json({ error: 'not_complete' }, { status: 403 })
    }

    const doc = await issueCertificate({ discordId: session.discordId, tier, name, origin: baseUrl(req) })
    return Response.json({ certificate: publicCertificate(doc) })
  } catch (e) {
    console.error('certificate claim error:', e)
    return Response.json({ error: 'internal_error' }, { status: 500 })
  }
}
