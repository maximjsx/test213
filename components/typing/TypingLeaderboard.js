'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Bear from '../Bear'
import Skeleton from '../ui/Skeleton'
import Segmented from './Segmented'
import styles from './TypingLeaderboard.module.css'

const PERIODS = [
  { id: 'week', label: 'This week' },
  { id: 'all', label: 'All time' },
]
const PODIUM = ['gold', 'silver', 'bronze']

// Fastest accounts on one board. refreshKey changes after a finished run so
// the list picks up the new result.
export default function TypingLeaderboard({ board, refreshKey = 0, title = 'Leaderboard' }) {
  const [period, setPeriod] = useState('week')
  const [cache, setCache] = useState({})
  const key = `${board}|${period}|${refreshKey}`
  const data = cache[key]

  useEffect(() => {
    if (cache[key]) return
    fetch(`/api/leaderboard/typing?board=${board}&period=${period}`)
      .then(r => r.json())
      .then(d => setCache(c => ({ ...c, [key]: d })))
      .catch(() => setCache(c => ({ ...c, [key]: { top: [], me: null } })))
  }, [key]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section className={styles.board} aria-labelledby="typing-board">
      <div className={styles.head}>
        <h2 id="typing-board" className={styles.title}>{title}</h2>
        <Segmented label="Period" options={PERIODS} value={period} onChange={setPeriod} />
      </div>

      {!data ? (
        <div className={styles.list} aria-busy="true" aria-label="Loading leaderboard">
          {[0, 1, 2].map(i => <Skeleton key={i} height={56} radius="var(--r)" />)}
        </div>
      ) : data.top?.length ? (
        <ol className={styles.list}>
          {data.top.map(row => (
            <li key={row.rank}>
              <Link href={`/u/${row.username}`} className={`${styles.row} ${row.isMe ? styles.rowMe : ''}`}>
                <span className={`${styles.rank} ${row.rank <= 3 ? styles[PODIUM[row.rank - 1]] : ''}`}>{row.rank}</span>
                {row.avatarUrl
                  ? <img src={row.avatarUrl} alt="" className={styles.avatar} width={32} height={32} />
                  : <span className={styles.avatar}><Bear mood="idle" size={32} /></span>}
                <span className={styles.name}>{row.username}{row.isMe ? ' (you)' : ''}</span>
                <span className={styles.accuracy}>{row.accuracy}%</span>
                <span className={styles.wpm}>{row.wpm} <small>wpm</small></span>
              </Link>
            </li>
          ))}
        </ol>
      ) : (
        <p className={styles.empty}>{period === 'week' ? 'No runs this week yet. Be the first.' : 'No runs yet. Be the first.'}</p>
      )}

      {data?.me && data.me.rank > data.top.length && (
        <p className={styles.note}>You are #{data.me.rank} with {data.me.wpm} wpm.</p>
      )}
      {data && !data.signedIn && (
        <p className={styles.note}>
          The test works without an account. <Link href="/profile" className={styles.link}>Sign in</Link> to put your runs on the leaderboard.
        </p>
      )}
    </section>
  )
}
