import { ImageResponse } from 'next/og'
import { OG_SIZE, OG_COLORS, ogFonts, fetchJson, Flag, Frame } from '../../../lib/ogCard'

// The certificate as a card, for sharing on Discord, LinkedIn and the like
export const runtime = 'edge'
export const alt = 'Learn Bulgarian certificate'
export const size = OG_SIZE
export const contentType = 'image/png'

const formatDate = iso => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

export default async function CertificateImage({ params }) {
  const data = await fetchJson(`/api/certificates/${encodeURIComponent(params.id)}`)
  const cert = data?.certificate
  const fonts = await ogFonts()
  if (!cert) {
    return new ImageResponse(
      <Frame><Flag /><div style={{ display: 'flex', fontSize: 80, color: OG_COLORS.text }}>Learn Bulgarian certificate</div></Frame>,
      { ...size, fonts },
    )
  }
  return new ImageResponse(
    (
      <Frame>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Flag width={110} height={70} />
          <div style={{ display: 'flex', padding: '10px 26px', borderRadius: 999, background: OG_COLORS.surfaceHi, fontSize: 30, color: OG_COLORS.teal }}>
            Verified certificate
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', fontSize: 36, color: OG_COLORS.muted }}>Awarded to</div>
          <div style={{ display: 'flex', fontSize: 84, color: OG_COLORS.text, lineHeight: 1.05 }}>{cert.name}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', fontSize: 48, color: OG_COLORS.yellow }}>{`${cert.title} (${cert.level})`}</div>
          <div style={{ display: 'flex', fontSize: 30, color: OG_COLORS.muted }}>
            {`${cert.lessons} lessons, issued ${formatDate(cert.issuedAt)} by Learn Bulgarian`}
          </div>
        </div>
      </Frame>
    ),
    { ...size, fonts },
  )
}
