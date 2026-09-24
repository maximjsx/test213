import { ImageResponse } from 'next/og'

// The preview card shown when a link to the site is shared. Child routes
// without their own image inherit it.
export const runtime = 'edge'
export const alt = 'Learn Bulgarian: free interactive course'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const COLORS = { bg: '#121825', surface: '#1a2438', text: '#e2ecfa', muted: '#809fcb', teal: '#00bfa0' }
const FLAG = ['#ffffff', '#00966e', '#d62612']

export default async function OpenGraphImage() {
  const font = await fetch(new URL('../lib/fonts/Nunito-Black.ttf', import.meta.url)).then(r => r.arrayBuffer())
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', background: COLORS.bg, padding: 56, fontFamily: 'Nunito' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 28, padding: '0 64px', background: COLORS.surface, borderRadius: 48 }}>
          <div style={{ display: 'flex', flexDirection: 'column', width: 132, height: 84, borderRadius: 14, overflow: 'hidden' }}>
            {FLAG.map(c => <div key={c} style={{ flex: 1, background: c }} />)}
          </div>
          <div style={{ fontSize: 92, color: COLORS.text, lineHeight: 1 }}>Learn Bulgarian</div>
          <div style={{ fontSize: 40, color: COLORS.muted }}>Free bite-sized lessons with audio</div>
          <div style={{ display: 'flex', gap: 18, fontSize: 44, color: COLORS.teal }}>
            <span>Здравей!</span><span style={{ color: COLORS.muted }}>·</span><span>Как си?</span>
          </div>
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: 'Nunito', data: font, weight: 900, style: 'normal' }] },
  )
}
