import styles from './Decks.module.css'

export default function DeckCounts({ deck }) {
  return (
    <span className={styles.counts}>
      {deck.dueToday > 0 && <span className={`${styles.count} ${styles.countDue}`}>{deck.dueToday} due</span>}
      {deck.newToday > 0 && <span className={`${styles.count} ${styles.countNew}`}>{deck.newToday} new</span>}
      <span className={styles.count}>{deck.total} {deck.total === 1 ? 'card' : 'cards'}</span>
    </span>
  )
}
