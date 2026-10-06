import styles from './BearBody.module.css'

// Full-body mascot for the streak scenes. Each limb sits in its own group,
// pivoting at the shoulder or hip, so a scene class can move it on its own.
// scenes: jump | run | hang | munch
export default function BearBody({ scene = 'jump', size = 150 }) {
  const munch = scene === 'munch'
  // Eating brings the paws up to the mouth, so they have to draw over the face
  const arms = (
    <>
      <g transform="translate(52 114)"><g className={`${styles.limb} ${styles.armL}`}><Arm /></g></g>
      <g transform="translate(108 114)"><g className={`${styles.limb} ${styles.armR}`}><Arm /></g></g>
    </>
  )
  return (
    <svg
      viewBox="0 0 160 200"
      width={size}
      height={size * 1.25}
      className={`${styles.bear} ${styles[scene]}`}
      overflow="visible"
      aria-hidden="true"
    >
      <g transform="translate(66 162)"><g className={`${styles.limb} ${styles.legL}`}><Leg /></g></g>
      <g transform="translate(94 162)"><g className={`${styles.limb} ${styles.legR}`}><Leg /></g></g>

      <ellipse cx="80" cy="136" rx="32" ry="36" fill="#a9713d" />
      <ellipse cx="80" cy="142" rx="20" ry="24" fill="#e9cda3" />

      {!munch && arms}

      <g className={styles.head}>
        <circle cx="50" cy="34" r="14" fill="#a9713d" />
        <circle cx="110" cy="34" r="14" fill="#a9713d" />
        <circle cx="50" cy="34" r="7" fill="#8a5a30" />
        <circle cx="110" cy="34" r="7" fill="#8a5a30" />
        <circle cx="80" cy="64" r="38" fill="#b57c46" />
        <ellipse cx="80" cy="77" rx="16" ry="12" fill="#e9cda3" />
        <ellipse cx="80" cy="71" rx="6" ry="4.6" fill="#42301e" />
        <path d="M61 58 Q66 51.5 71 58" stroke="#42301e" strokeWidth="3.4" fill="none" strokeLinecap="round" />
        <path d="M89 58 Q94 51.5 99 58" stroke="#42301e" strokeWidth="3.4" fill="none" strokeLinecap="round" />
        <ellipse cx="56" cy="69" rx="6" ry="4" fill="#e08a8a" opacity="0.55" />
        <ellipse cx="104" cy="69" rx="6" ry="4" fill="#e08a8a" opacity="0.55" />
        {munch
          ? <ellipse cx="80" cy="84" rx="6" ry="4.5" fill="#42301e" className={styles.chew} />
          : <path d="M72 80 Q80 90 88 80 Z" fill="#42301e" />}
      </g>

      {munch && arms}
    </svg>
  )
}

function Arm() {
  return (
    <>
      <rect x="-8" y="-4" width="16" height="42" rx="8" fill="#a9713d" />
      <circle cx="0" cy="32" r="5" fill="#e9cda3" />
    </>
  )
}

function Leg() {
  return (
    <>
      <ellipse cx="0" cy="12" rx="12" ry="16" fill="#a9713d" />
      <ellipse cx="0" cy="22" rx="7" ry="4.5" fill="#e9cda3" />
    </>
  )
}
