'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Bear from '../../components/Bear'
import Skeleton from '../../components/ui/Skeleton'
import CoinIcon from '../../components/ui/CoinIcon'
import TypingRanks from '../../components/typing/TypingRanks'
import styles from './page.module.css'

const PODIUM = ['rankGold', 'rankSilver', 'rankBronze']
const PERIODS = [
  { id: 'league', label: 'LEAGUE' },
  { id: 'week',  label: 'WEEK' },
  { id: 'month', label: 'MONTH' },
  { id: 'all',   label: 'ALL TIME' },
  { id: 'typing', label: 'TYPING' },
]

function LeagueHeader({ league }) {
  if (!league) {
    return (
      <div className={styles.leagueCard}>
        <div className={styles.leagueName}>Weekly leagues</div>
        <p className={styles.leagueText}>
          Sign in to join a league. Everyone starts in Bronze, and the coins you earn each week decides your league for the next one.
        </p>
        <Link href="/profile" className={styles.joinLink}>Sign in</Link>
      </div>
    )
  }
  return (
    <div className={styles.leagueCard} style={{ '--league': league.color }}>
      <span className={styles.leagueBadge} aria-hidden="true">
        <img src="/icons/trophy.png" alt="" width={30} height={30} />
      </span>
      <div className={styles.leagueName}>{league.name} League</div>
      <p className={styles.leagueText}>
        {league.next
          ? <>Earn <strong>{league.next.minCoins} coins</strong> this week to move up to {league.next.name}.</>
          : <>You are in the top league. Earn {league.stayCoins} coins a week to stay here.</>}
        {league.next && league.index > 0 && <> Below {league.stayCoins} coins you drop down a league.</>}
      </p>
    </div>
  )
}

export default function LeaderboardPage() {
  const [period, setPeriod] = useState('league')
  const [cache, setCache] = useState({})
  const data = cache[period]

  // ?tab=typing opens a board directly, e.g. from the typing test
  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get('tab')
    if (PERIODS.some(p => p.id === tab)) setPeriod(tab)
  }, [])

  useEffect(() => {
    if (cache[period] || period === 'typing') return
    fetch(`/api/leaderboard?period=${period}`)
      .then(r => r.json())
      .then(d => setCache(c => ({ ...c, [period]: d })))
      .catch(() => setCache(c => ({ ...c, [period]: { top: [], me: null } })))
  }, [period]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={styles.page}>
      <div className={styles.head}>
        <img src="/icons/trophy_with_star.png" alt="" width={56} height={56} />
        <h1 className={styles.title}>Leaderboard</h1>
        <p className={styles.sub}>{period === 'typing' ? 'Fastest Bulgarian typists' : 'Top coin earners'}</p>
      </div>

      <div className={styles.tabs}>
        {PERIODS.map(p => (
          <button
            key={p.id}
            className={`${styles.tab} ${period === p.id ? styles.tabActive : ''}`}
            onClick={() => setPeriod(p.id)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {period === 'league' && data && <LeagueHeader league={data.league} />}

      {period === 'typing' ? <TypingRanks /> : data === undefined ? (
        <div className={styles.list} aria-busy="true" aria-label="Loading leaderboard">
          {[0, 1, 2, 3, 4].map(i => <Skeleton key={i} height={64} radius="var(--r)" />)}
        </div>
      ) : period === 'league' && !data.league ? null : data.top.length === 0 ? (
        <div className={styles.empty}>
          <Bear mood="happy" size={90} />
          <p>
            {period === 'all'
              ? 'No one on the board yet. Sign in on your profile and be the first!'
              : 'No coins earned in this period yet. Finish a lesson and take the top spot!'}
          </p>
        </div>
      ) : (
        <div className={styles.list}>
          {data.top.map(row => (
            <Link key={row.rank} href={`/u/${row.username}`} className={`${styles.row} ${row.isMe ? styles.rowMe : ''}`}>
              <span className={`${styles.rank} ${row.rank <= 3 ? styles[PODIUM[row.rank - 1]] : ''}`}>{row.rank}</span>
              {row.avatarUrl
                ? <img src={row.avatarUrl} alt="" className={styles.rowAvatar} width={38} height={38} />
                : <span className={styles.rowAvatar}><Bear mood="idle" size={38} /></span>}
              <span className={styles.rowName}>{row.username}{row.isMe ? ' (you)' : ''}</span>
              {row.streak >= 3 && (
                <span className={styles.rowStreak}>
                  <img src="/icons/fire.png" alt="" width={14} height={14} />{row.streak}
                </span>
              )}
              <span className={styles.rowCoins}>{row.coins} <CoinIcon size={16} /></span>
            </Link>
          ))}
        </div>
      )}

      {data?.me && data.me.rank > 50 && (
        <div className={styles.meFooter}>
          Your rank: #{data.me.rank} with {data.me.coins} coins
        </div>
      )}
      {data && !data.me && period !== 'league' && (
        <div className={styles.meFooter}>
          <Link href="/profile" className={styles.joinLink}>Sign in to join the leaderboard</Link>
        </div>
      )}
    </div>
  )
}
