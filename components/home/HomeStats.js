import Tooltip from '../ui/Tooltip'
import CoinCounter from './CoinCounter'
import styles from './HomeStats.module.css'

// Streak, coins and quests. Each opens its own dialog: the streak calendar,
// the shop (where coins are spent) and the daily quests.
export default function HomeStats({ state, streakAtRisk, claimable, onOpenStreak, onOpenQuests, onOpenShop, className = '' }) {
  const streakLabel = streakAtRisk
    ? `${state.streak} day streak, do a lesson today to keep it`
    : `${state.streak} day streak`
  return (
    <div className={`${styles.stats} ${className}`}>
      <Tooltip label={streakAtRisk ? 'Streak at risk today' : 'Day streak'}>
        <button className={`${styles.stat} ${streakAtRisk ? styles.atRisk : ''}`} onClick={onOpenStreak} aria-label={`${streakLabel}. Open calendar`}>
          <img src="/icons/fire.png" alt="" width={26} height={26} className={styles.flame} />
          <span className={styles.num}>{state.streak}</span>
        </button>
      </Tooltip>
      <Tooltip label="Coins, spend them in the shop">
        <button className={styles.stat} onClick={onOpenShop} aria-label={`${state.coins} coins. Open shop`}>
          <CoinCounter coins={state.coins} />
        </button>
      </Tooltip>
      <Tooltip label="Daily quests" align="end">
        <button className={styles.stat} onClick={onOpenQuests} aria-label={claimable ? `Daily quests, ${claimable} ready to claim` : 'Daily quests'}>
          <img src="/icons/another_star.png" alt="" width={26} height={26} />
          <span className={styles.label}>Quests</span>
          {claimable > 0 && <span className={styles.badge}>{claimable}</span>}
        </button>
      </Tooltip>
    </div>
  )
}
