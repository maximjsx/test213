// Hero illustration: layered Balkan ridges under a rising sun, with a few
// Cyrillic letters drifting above. Drawn in theme tokens.
export default function LibraryArt({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 360 240" role="img" aria-label="Mountains at sunrise with Cyrillic letters">
      <defs>
        <linearGradient id="lib-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--blue-bg)" />
          <stop offset="1" stopColor="var(--surface)" />
        </linearGradient>
      </defs>
      <rect width="360" height="240" rx="24" fill="url(#lib-sky)" />
      <circle cx="250" cy="120" r="46" fill="var(--yellow)" opacity="0.9" />
      <circle cx="250" cy="120" r="62" fill="var(--yellow)" opacity="0.12" />
      <path d="M0 170 L60 118 L100 146 L160 92 L214 140 L262 104 L320 150 L360 128 V240 H0Z" fill="var(--border-hi)" />
      <path d="M0 196 L48 160 L96 184 L150 142 L208 186 L258 156 L310 190 L360 166 V240 H0Z" fill="var(--teal-press)" />
      <path d="M160 92 L176 106 L166 104 L156 112 L148 102Z M262 104 L274 114 L266 113 L258 118 L252 111Z" fill="var(--text)" opacity="0.8" />
      <path d="M0 218 Q90 196 180 214 T360 206 V240 H0Z" fill="var(--green-press)" />
      <g fontFamily="inherit" fontWeight="900" fill="var(--text)">
        <text x="44" y="70" fontSize="40" opacity="0.9">Б</text>
        <text x="104" y="48" fontSize="26" opacity="0.55">ъ</text>
        <text x="142" y="80" fontSize="32" opacity="0.7">Ж</text>
        <text x="312" y="60" fontSize="24" opacity="0.5">щ</text>
      </g>
    </svg>
  )
}
