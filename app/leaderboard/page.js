'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Bear from '../../components/Bear'
import Chevron from '../../components/Chevron'
import styles from './page.module.css'

const MEDALS = ['🥇', '🥈', '🥉']

export default function LeaderboardPage() {
  const [data, setData] = useState(undefined)

  useEffect(() => {
    fetch('/api/leaderboard')
      .then(r => r.json())
      .then(setData)
      .catch(() => setData({ top: [], me: null }))
  }, [])

  return (
    <div className={styles.page}>
      <div className={styles.topRow}>
        <Link href="/" className={styles.backBtn}><Chevron /> Course</Link>
        <Link href="/profile" className={styles.profileLink}>Profile</Link>
      </div>

      <div className={styles.head}>
        <img src="/icons/trophy_with_star.png" alt="" width={56} height={56} />
        <h1 className={styles.title}>Leaderboard</h1>
        <p className={styles.sub}>Top XP earners of all time</p>
      </div>

      {data === undefined ? (
        <div className={styles.loading}>Loading…</div>
      ) : data.top.length === 0 ? (
        <div className={styles.empty}>
          <Bear mood="happy" size={90} />
          <p>No one on the board yet. Sign in on your profile and be the first!</p>
        </div>
      ) : (
        <div className={styles.list}>
          {data.top.map(row => (
            <div key={row.rank} className={`${styles.row} ${row.isMe ? styles.rowMe : ''}`}>
              <span className={styles.rank}>{row.rank <= 3 ? MEDALS[row.rank - 1] : row.rank}</span>
              {row.avatarUrl
                ? <img src={row.avatarUrl} alt="" className={styles.rowAvatar} width={38} height={38} />
                : <span className={styles.rowAvatar}><Bear mood="idle" size={38} /></span>}
              <span className={styles.rowName}>{row.username}{row.isMe ? ' (you)' : ''}</span>
              {row.streak >= 3 && (
                <span className={styles.rowStreak}>
                  <img src="/icons/fire.png" alt="" width={14} height={14} />{row.streak}
                </span>
              )}
              <span className={styles.rowXp}>{row.xp} XP</span>
            </div>
          ))}
        </div>
      )}

      {data?.me && data.me.rank > 50 && (
        <div className={styles.meFooter}>
          Your rank: #{data.me.rank} with {data.me.xp} XP
        </div>
      )}
      {data && !data.me && (
        <div className={styles.meFooter}>
          <Link href="/profile" className={styles.joinLink}>Sign in to join the leaderboard</Link>
        </div>
      )}
    </div>
  )
}
