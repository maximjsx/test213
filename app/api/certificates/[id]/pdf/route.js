import { certificatesCollection } from '@/lib/certificateStore'

export const dynamic = 'force-dynamic'

export async function GET(req, { params }) {
  try {
    const col = await certificatesCollection()
    const doc = await col.findOne({ _id: String(params.id).toUpperCase() }, { projection: { pdf: 1 } })
    if (!doc) return Response.json({ error: 'not_found' }, { status: 404 })

    return new Response(Buffer.from(doc.pdf.buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="bulgarian-certificate-${doc._id}.pdf"`,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (e) {
    console.error('certificate pdf error:', e)
    return Response.json({ error: 'internal_error' }, { status: 500 })
  }
}
