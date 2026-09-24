import Link from 'next/link'
import styles from './Home.module.css'

const LINKS = [
  { href: '/letters', label: 'Letters', icon: <span className={styles.practiceGlyph} lang="bg">Аа</span> },
  { href: '/words', label: 'Words', icon: <img src="/icons/open_book.png" alt="" width={28} height={28} /> },
  { href: '/speed?mode=words', label: 'Speed round', icon: <img src="/icons/lightning.png" alt="" width={28} height={28} /> },
]

export default function PracticeLinks() {
  return (
    <nav className={styles.practiceLinks} aria-label="Practice">
      {LINKS.map(p => (
        <Link key={p.href} href={p.href} className={styles.practiceLink}>
          {p.icon}
          <span>{p.label}</span>
        </Link>
      ))}
    </nav>
  )
}
