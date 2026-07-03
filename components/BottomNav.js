'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '../hooks/useAuth'
import Bear from './Bear'
import styles from './BottomNav.module.css'

const ITEMS = [
  {
    href: '/', label: 'Learn', match: p => p === '/',
    icon: (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 11.5 12 4l9 7.5" />
        <path d="M5.5 10v9a1 1 0 0 0 1 1H9v-6h6v6h2.5a1 1 0 0 0 1-1v-9" />
      </svg>
    ),
  },
  {
    href: '/leaderboard', label: 'Ranks', match: p => p.startsWith('/leaderboard'),
    icon: (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 21h8" /><path d="M12 17v4" />
        <path d="M7 4h10v6a5 5 0 0 1-10 0V4Z" />
        <path d="M7 6H4.5A1.5 1.5 0 0 0 3 7.5 4.5 4.5 0 0 0 7 12" />
        <path d="M17 6h2.5A1.5 1.5 0 0 1 21 7.5 4.5 4.5 0 0 1 17 12" />
      </svg>
    ),
  },
]

export default function BottomNav() {
  const pathname = usePathname()
  const { user } = useAuth()

  return (
    <nav className={styles.nav}>
      {ITEMS.map(it => {
        const active = it.match(pathname)
        return (
          <Link key={it.href} href={it.href} className={`${styles.item} ${active ? styles.active : ''}`}>
            {it.icon}
            <span className={styles.label}>{it.label}</span>
          </Link>
        )
      })}
      <Link href="/profile" className={`${styles.item} ${pathname.startsWith('/profile') ? styles.active : ''}`}>
        {user?.avatarUrl
          ? <img src={user.avatarUrl} alt="" width={24} height={24} className={styles.avatar} />
          : <Bear mood="idle" size={24} />}
        <span className={styles.label}>{user ? 'You' : 'Sign in'}</span>
      </Link>
    </nav>
  )
}
