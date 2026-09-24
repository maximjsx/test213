import Link from 'next/link'
import Bear from '../Bear'
import XpCounter from './XpCounter'
import styles from './Home.module.css'

export default function HomeHeader({ state, user, streakAtRisk, claimable, onOpenStreak, onOpenQuests, onOpenShop }) {
  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <div className={styles.logo}>
          <img src="/icons/bulgarian_flag.png" alt="" className={styles.logoFlag} width={34} height={34} />
          <span className={styles.logoName}>
            Learn Bulgarian
            <sup className={styles.betaBadge}>Beta</sup>
          </span>
        </div>
        <div className={styles.headerStats}>
          <button className={`${styles.streak} ${styles.statBtn} ${streakAtRisk ? styles.streakAtRisk : ''}`} onClick={onOpenStreak} title="Streak calendar" aria-label={`${state.streak} day streak, open calendar`}>
            <span className={styles.streakFlame}><img src="/icons/fire.png" alt="" width={26} height={26} /></span>
            <span className={styles.streakNum}>{state.streak}</span>
          </button>
          <XpCounter xp={state.xp} />
          <button className={styles.iconBtn} onClick={onOpenQuests} title="Daily quests" aria-label={claimable ? `Daily quests, ${claimable} ready to claim` : 'Daily quests'}>
            <img src="/icons/another_star.png" alt="" width={26} height={26} />
            <span className={styles.iconLabel}>Quests</span>
            {claimable > 0 && <span className={styles.questBadge}>{claimable}</span>}
          </button>
          <button className={styles.iconBtn} onClick={onOpenShop} title="Shop" aria-label="Shop">
            <img src="/icons/gift_box.png" alt="" width={28} height={28} />
            <span className={styles.iconLabel}>Shop</span>
          </button>
          <Link href="/leaderboard" className={`${styles.iconBtn} ${styles.leaderboardLink}`} title="Leaderboard" aria-label="Leaderboard">
            <img src="/icons/trophy.png" alt="" width={26} height={26} />
            <span className={styles.iconLabel}>Ranks</span>
          </Link>
          {user ? (
            <Link href="/profile" className={`${styles.iconBtn} ${styles.profileLink}`} title={user.username} aria-label="Your profile">
              {user.avatarUrl
                ? <img src={user.avatarUrl} alt="" width={30} height={30} style={{ borderRadius: '50%' }} />
                : <Bear mood="idle" size={30} />}
            </Link>
          ) : (
            <Link href="/profile" className={styles.claimBtn} title="Sign in with Discord">
              CLAIM ACCOUNT
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
