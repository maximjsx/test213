import { certificatesCollection, publicCertificate } from '@/lib/certificateStore'

export const dynamic = 'force-dynamic'

// Public: anyone holding the link or ID can check a certificate
export async function GET(req, { params }) {
  try {
    const col = await certificatesCollection()
    const doc = await col.findOne({ _id: String(params.id).toUpperCase() }, { projection: { pdf: 0, token: 0 } })
    if (!doc) return Response.json({ error: 'not_found' }, { status: 404 })
    return Response.json({ certificate: publicCertificate(doc) })
  } catch (e) {
    console.error('certificate lookup error:', e)
    return Response.json({ error: 'internal_error' }, { status: 500 })
  }
}
