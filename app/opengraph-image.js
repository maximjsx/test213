import { ImageResponse } from 'next/og'
import { OG_SIZE, OG_COLORS, ogFonts, Flag, Frame } from '../lib/ogCard'

// The preview card shown when a link to the site is shared. Child routes
// without their own image inherit it.
export const runtime = 'edge'
export const alt = 'Learn Bulgarian: free interactive course'
export const size = OG_SIZE
export const contentType = 'image/png'

export default async function OpenGraphImage() {
  return new ImageResponse(
    (
      <Frame>
        <Flag />
        <div style={{ display: 'flex', fontSize: 92, color: OG_COLORS.text, lineHeight: 1 }}>Learn Bulgarian</div>
        <div style={{ display: 'flex', fontSize: 40, color: OG_COLORS.muted }}>Free bite-sized lessons with audio</div>
        <div style={{ display: 'flex', gap: 18, fontSize: 44, color: OG_COLORS.teal }}>
          <span>Здравей!</span><span style={{ color: OG_COLORS.muted }}>·</span><span>Как си?</span>
        </div>
      </Frame>
    ),
    { ...size, fonts: await ogFonts() },
  )
}
