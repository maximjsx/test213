import Link from 'next/link'
import styles from './Home.module.css'

function LetterGlyph() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
      <rect x="2" y="2" width="24" height="24" rx="6" fill="var(--teal)" />
      <text x="14" y="20" textAnchor="middle" fontSize="15" fontWeight="900" fill="var(--on-accent)" fontFamily="inherit">Аа</text>
    </svg>
  )
}

const LINKS = [
  { href: '/letters', label: 'Letters', icon: <LetterGlyph /> },
  { href: '/words', label: 'Words', icon: <img src="/icons/open_book.png" alt="" width={28} height={28} /> },
  { href: '/speed?mode=words', label: 'Speed round', icon: <img src="/icons/lightning.png" alt="" width={28} height={28} /> },
]

export default function PracticeLinks({ className = '' }) {
  return (
    <nav className={`${styles.tiles} ${className}`} aria-label="Practice">
      {LINKS.map(p => (
        <Link key={p.href} href={p.href} className={styles.tile}>
          <span className={styles.tileIcon}>{p.icon}</span>
          <span>{p.label}</span>
        </Link>
      ))}
    </nav>
  )
}
