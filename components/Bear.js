import styles from './Bear.module.css'

// Site mascot: a brown bear. Pure inline SVG so it needs no assets,
// swap the shapes for real art later without touching call sites.
// moods: idle | happy | cheer | sad
export default function Bear({ mood = 'happy', size = 96, className = '' }) {
  const anim = mood === 'cheer' ? styles.bounce : mood === 'sad' ? '' : styles.bob
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={`${anim} ${className}`}
      aria-hidden="true"
    >
      {/* ears */}
      <circle cx="32" cy="30" r="15" fill="#a9713d" />
      <circle cx="88" cy="30" r="15" fill="#a9713d" />
      <circle cx="32" cy="30" r="7.5" fill="#8a5a30" />
      <circle cx="88" cy="30" r="7.5" fill="#8a5a30" />

      {/* paws up when cheering */}
      {mood === 'cheer' && (
        <>
          <circle cx="12" cy="52" r="11" fill="#a9713d" />
          <circle cx="108" cy="52" r="11" fill="#a9713d" />
        </>
      )}

      {/* head */}
      <circle cx="60" cy="62" r="40" fill="#b57c46" />

      {/* muzzle */}
      <ellipse cx="60" cy="75" rx="17" ry="13" fill="#e9cda3" />
      <ellipse cx="60" cy="68.5" rx="6.5" ry="5" fill="#42301e" />

      {/* eyes */}
      {mood === 'cheer' ? (
        <>
          <path d="M40 55 Q45.5 48.5 51 55" stroke="#42301e" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <path d="M69 55 Q74.5 48.5 80 55" stroke="#42301e" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="45.5" cy="55" r="4.6" fill="#42301e" />
          <circle cx="74.5" cy="55" r="4.6" fill="#42301e" />
          <circle cx="47" cy="53.5" r="1.5" fill="#fff" />
          <circle cx="76" cy="53.5" r="1.5" fill="#fff" />
        </>
      )}

      {/* sad eyebrows and sweat drop */}
      {mood === 'sad' && (
        <>
          <path d="M39 47 L51 50" stroke="#42301e" strokeWidth="3" strokeLinecap="round" />
          <path d="M81 47 L69 50" stroke="#42301e" strokeWidth="3" strokeLinecap="round" />
          <path d="M92 44 q5 7 0 10 q-5 -3 0 -10" fill="#1cb0f6" />
        </>
      )}

      {/* blush when cheering */}
      {mood === 'cheer' && (
        <>
          <ellipse cx="34" cy="66" rx="6" ry="4" fill="#e08a8a" opacity="0.55" />
          <ellipse cx="86" cy="66" rx="6" ry="4" fill="#e08a8a" opacity="0.55" />
        </>
      )}

      {/* mouth */}
      {mood === 'sad' ? (
        <path d="M53 82 Q60 77 67 82" stroke="#42301e" strokeWidth="3" fill="none" strokeLinecap="round" />
      ) : mood === 'cheer' ? (
        <path d="M52 78 Q60 87 68 78 Z" fill="#42301e" />
      ) : (
        <path d="M53 79 Q60 84 67 79" stroke="#42301e" strokeWidth="3" fill="none" strokeLinecap="round" />
      )}
    </svg>
  )
}
