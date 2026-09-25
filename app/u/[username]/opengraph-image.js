import { ImageResponse } from 'next/og'
import { OG_SIZE, OG_COLORS, ogFonts, ogOrigin, fetchJson, Flag, Frame } from '../../../lib/ogCard'

// A learner's streak card, shown when their profile link is shared
export const runtime = 'edge'
export const alt = 'Learning streak on Learn Bulgarian'
export const size = OG_SIZE
export const contentType = 'image/png'

function Stat({ icon, value, label, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '24px 32px', borderRadius: 32, background: OG_COLORS.surfaceHi }}>
      {icon && <img src={icon} width={64} height={64} alt="" />}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', fontSize: 60, color, lineHeight: 1 }}>{value}</div>
        <div style={{ display: 'flex', fontSize: 26, color: OG_COLORS.muted }}>{label}</div>
      </div>
    </div>
  )
}

export default async function ProfileImage({ params }) {
  const data = await fetchJson(`/api/user/${encodeURIComponent(decodeURIComponent(params.username))}`)
  const user = data?.user
  const origin = ogOrigin()
  const fonts = await ogFonts()
  if (!user) {
    return new ImageResponse(
      <Frame><Flag /><div style={{ display: 'flex', fontSize: 80, color: OG_COLORS.text }}>Learn Bulgarian</div></Frame>,
      { ...size, fonts },
    )
  }
  return new ImageResponse(
    (
      <Frame>
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          {user.avatarUrl
            ? <img src={user.avatarUrl} width={112} height={112} alt="" style={{ borderRadius: 56 }} />
            : <Flag width={112} height={72} />}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', fontSize: 72, color: OG_COLORS.text, lineHeight: 1 }}>{user.username}</div>
            <div style={{ display: 'flex', fontSize: 32, color: OG_COLORS.muted }}>is learning Bulgarian</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 24 }}>
          <Stat icon={`${origin}/icons/fire.png`} value={user.streak} label="day streak" color={OG_COLORS.orange} />
          <Stat icon={`${origin}/icons/open_book.png`} value={user.lessonsCount} label="lessons" color={OG_COLORS.teal} />
          <Stat icon={`${origin}/icons/star.png`} value={user.coins} label="coins earned" color={OG_COLORS.yellow} />
        </div>
      </Frame>
    ),
    { ...size, fonts },
  )
}
