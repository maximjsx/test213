// Artwork inside a topic bubble. A level's own `image` wins, then the built-in
// drawing for the core topics, then its short text icon.
const ACCENT = '#ffd84d'

const DRAWINGS = {
  alphabet: c => (
    <>
      <rect x="16" y="28" width="38" height="46" rx="8" fill="#fff" opacity=".8" transform="rotate(-12 35 51)" />
      <text x="35" y="62" textAnchor="middle" fontSize="28" fontWeight="900" fill={c} opacity=".75" transform="rotate(-12 35 51)">А</text>
      <rect x="42" y="24" width="40" height="50" rx="8" fill="#fff" transform="rotate(8 62 49)" />
      <text x="62" y="62" textAnchor="middle" fontSize="34" fontWeight="900" fill={c} transform="rotate(8 62 49)">Б</text>
    </>
  ),
  greetings: c => (
    <>
      <path d="M14 30a12 12 0 0 1 12-12h32a12 12 0 0 1 12 12v14a12 12 0 0 1-12 12H38l-13 11V56a12 12 0 0 1-11-12z" fill="#fff" />
      <circle cx="31" cy="37" r="4.5" fill={c} />
      <circle cx="42" cy="37" r="4.5" fill={c} />
      <circle cx="53" cy="37" r="4.5" fill={c} />
      <path d="M46 58a10 10 0 0 1 10-10h20a10 10 0 0 1 10 10v6a10 10 0 0 1-10 10h-1v9l-10-9h-9a10 10 0 0 1-10-10z" fill={ACCENT} />
    </>
  ),
  town: c => (
    <>
      <rect x="16" y="42" width="22" height="38" rx="3" fill="#fff" opacity=".7" />
      <rect x="62" y="34" width="22" height="46" rx="3" fill="#fff" opacity=".85" />
      <rect x="36" y="20" width="28" height="60" rx="3" fill="#fff" />
      {[29, 41, 53].map(y => [42, 53].map(x => <rect key={`${x}-${y}`} x={x} y={y} width="5" height="7" rx="1" fill={c} />))}
      <rect x="46" y="66" width="8" height="14" rx="1.5" fill={ACCENT} />
      <rect x="10" y="78" width="80" height="4" rx="2" fill="rgba(0,0,0,.18)" />
    </>
  ),
  food: c => (
    <>
      <circle cx="50" cy="52" r="24" fill="#fff" />
      <circle cx="50" cy="52" r="15" fill="none" stroke={c} strokeOpacity=".35" strokeWidth="3" />
      <path d="M12 26v13a5 5 0 0 0 10 0V26M17 26v12" stroke="#fff" strokeWidth="3" strokeLinecap="round" fill="none" />
      <rect x="15.5" y="42" width="3" height="34" rx="1.5" fill="#fff" />
      <path d="M85 26c-6 4-7 16-6 26h6z" fill="#fff" />
      <rect x="81.5" y="50" width="3.5" height="26" rx="1.7" fill="#fff" />
    </>
  ),
  family: () => (
    <>
      <circle cx="33" cy="33" r="9" fill="#fff" />
      <rect x="21" y="45" width="24" height="34" rx="12" fill="#fff" />
      <circle cx="67" cy="31" r="10" fill="#fff" />
      <rect x="54" y="44" width="26" height="36" rx="13" fill="#fff" />
      <circle cx="50" cy="52" r="7" fill={ACCENT} />
      <rect x="41" y="61" width="18" height="19" rx="9" fill={ACCENT} />
    </>
  ),
  school: c => (
    <>
      <path d="M50 32C40 25 26 25 14 29v45c12-4 26-4 36 3z" fill="#fff" />
      <path d="M50 32c10-7 24-7 36-3v45c-12-4-26-4-36 3z" fill="#fff" opacity=".85" />
      <path d="M22 40c7-2 14-2 21 1M22 49c7-2 14-2 21 1M22 58c7-2 14-2 21 1M57 41c7-3 14-3 21-1M57 50c7-3 14-3 21-1" stroke={c} strokeOpacity=".4" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <rect x="47.5" y="30" width="5" height="48" rx="2.5" fill={ACCENT} />
    </>
  ),
}

export default function TopicArt({ level, size = 64 }) {
  if (level.image?.url) {
    return <img src={level.image.url} alt="" width={size} height={size} style={{ objectFit: 'contain', display: 'block' }} draggable={false} />
  }
  const draw = DRAWINGS[level.id]
  if (draw) {
    return (
      <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true" style={{ display: 'block' }}>
        {draw(level.color)}
      </svg>
    )
  }
  const label = level.icon || level.title?.slice(0, 2) || ''
  return (
    <span style={{ fontSize: size * (label.length > 2 ? 0.34 : 0.5), fontWeight: 900, color: '#fff', lineHeight: 1 }}>
      {label}
    </span>
  )
}
