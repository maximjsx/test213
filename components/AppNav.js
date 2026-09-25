'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '../hooks/useAuth'
import { useDecks } from '../hooks/useDecks'
import Bear from './Bear'
import styles from './AppNav.module.css'

const icon = paths => (
  <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {paths}
  </svg>
)

const startsWithAny = (p, prefixes) => prefixes.some(x => p === x || p.startsWith(x + '/') || p.startsWith(x + '?'))

const ITEMS = [
  {
    href: '/', label: 'Learn',
    match: p => p === '/' || startsWithAny(p, ['/topic', '/level']),
    icon: icon(<><path d="M3 11.5 12 4l9 7.5" /><path d="M5.5 10v9a1 1 0 0 0 1 1H9v-6h6v6h2.5a1 1 0 0 0 1-1v-9" /></>),
  },
  {
    href: '/practice', label: 'Practice', badge: 'due',
    match: p => startsWithAny(p, ['/practice', '/words', '/letters', '/speed', '/decks', '/study']),
    icon: icon(<><path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11" /></>),
  },
  {
    href: '/wiki', label: 'Wiki',
    match: p => startsWithAny(p, ['/wiki', '/glossary', '/watch', '/about-bulgarian']),
    icon: icon(<><path d="M4 19.5V5a2 2 0 0 1 2-2h4v18H6a2 2 0 0 1-2-1.5Z" /><path d="M10 3h4v18h-4" /><path d="m15.5 4.2 3.9-1 2.6 16.5-3.9 1Z" /></>),
  },
  {
    href: '/leaderboard', label: 'Ranks',
    match: p => startsWithAny(p, ['/leaderboard']),
    icon: icon(<><path d="M8 21h8M12 17v4" /><path d="M7 4h10v6a5 5 0 0 1-10 0V4Z" /><path d="M7 6H4.5A1.5 1.5 0 0 0 3 7.5 4.5 4.5 0 0 0 7 12M17 6h2.5A1.5 1.5 0 0 1 21 7.5 4.5 4.5 0 0 1 17 12" /></>),
  },
]

// Sections that get the app navigation. Lessons and the builder stay
// full-screen so nothing invites leaving mid-exercise.
const SHOW_ON = ['/topic', '/level', '/practice', '/words', '/letters', '/decks', '/wiki', '/glossary', '/watch', '/about-bulgarian', '/leaderboard', '/profile', '/u']
const FULL_SCREEN = ['/practice/mistakes']

export default function AppNav() {
  const pathname = usePathname()
  const { user } = useAuth()
  const { dueCount } = useDecks()
  if (startsWithAny(pathname, FULL_SCREEN)) return null
  if (pathname !== '/' && !startsWithAny(pathname, SHOW_ON)) return null

  const profileActive = startsWithAny(pathname, ['/profile', '/u'])
  return (
    <nav className={styles.nav} data-app-nav aria-label="Main">
      <Link href="/" className={styles.brand}>
        <img src="/icons/bulgarian_flag.png" alt="" width={34} height={34} />
        <span className={styles.brandName}>Learn Bulgarian</span>
      </Link>
      {ITEMS.map(it => {
        const active = it.match(pathname)
        return (
          <Link key={it.href} href={it.href} className={`${styles.item} ${active ? styles.active : ''}`} aria-current={active ? 'page' : undefined}>
            <span className={styles.iconWrap}>
              {it.icon}
              {it.badge && dueCount > 0 && <span className={styles.badge} aria-label={`${dueCount} cards due`}>{dueCount > 99 ? '99+' : dueCount}</span>}
            </span>
            <span className={styles.label}>{it.label}</span>
          </Link>
        )
      })}
      <Link href="/profile" className={`${styles.item} ${profileActive ? styles.active : ''}`} aria-current={profileActive ? 'page' : undefined}>
        {user?.avatarUrl
          ? <img src={user.avatarUrl} alt="" width={28} height={28} className={styles.avatar} />
          : <Bear mood="idle" size={28} />}
        <span className={styles.label}>{user ? 'Profile' : 'Sign in'}</span>
      </Link>
    </nav>
  )
}
