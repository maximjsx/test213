import { readEmbeddedToken } from '@/lib/certificatePdf'
import { sha256, verifyToken } from '@/lib/certificateSigning'
import { certificatesCollection, publicCertificate } from '@/lib/certificateStore'

export const dynamic = 'force-dynamic'

const MAX_BYTES = 5_000_000

async function signedId(bytes) {
  try {
    return verifyToken(await readEmbeddedToken(bytes))?.id || null
  } catch {
    return null // not a PDF, or one pdf-lib cannot parse
  }
}

// Body: the raw PDF bytes.
// exact:    byte-for-byte the file we issued
// modified: carries our valid signature, but the file was altered or re-saved
// unknown:  no valid signature from us
export async function POST(req) {
  try {
    const bytes = Buffer.from(await req.arrayBuffer())
    if (!bytes.length || bytes.length > MAX_BYTES) {
      return Response.json({ error: 'bad_file' }, { status: 400 })
    }

    const col = await certificatesCollection()
    const projection = { pdf: 0, token: 0 }
    const exact = await col.findOne({ fileHash: sha256(bytes) }, { projection })
    if (exact) return Response.json({ result: 'exact', certificate: publicCertificate(exact) })

    const id = await signedId(bytes)
    const signed = id && await col.findOne({ _id: id }, { projection })
    if (signed) return Response.json({ result: 'modified', certificate: publicCertificate(signed) })

    return Response.json({ result: 'unknown' })
  } catch (e) {
    console.error('certificate verify error:', e)
    return Response.json({ error: 'internal_error' }, { status: 500 })
  }
}
