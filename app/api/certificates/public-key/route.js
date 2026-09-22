import { publicKeyPem } from '@/lib/certificateSigning'

export const dynamic = 'force-dynamic'

// Lets anyone check a certificate's embedded signature without trusting our API
export async function GET() {
  return new Response(publicKeyPem(), {
    headers: { 'Content-Type': 'application/x-pem-file', 'Cache-Control': 'public, max-age=86400' },
  })
}
