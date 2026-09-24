import { achievementsFor } from '../lib/achievements'
import styles from './Achievements.module.css'

export default function Achievements({ state }) {
  const list = achievementsFor(state)
  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>Achievements</h2>
      <div className={styles.list}>
        {list.map(a => (
          <div key={a.id} className={`${styles.item} ${a.tier ? '' : styles.itemLocked}`}>
            <div className={styles.badge}>
              <img src={a.icon} alt="" width={30} height={30} />
              <span className={styles.level}>{a.tier ? `LVL ${a.tier}` : 'LOCKED'}</span>
            </div>
            <div className={styles.body}>
              <div className={styles.titleRow}>
                <span className={styles.title}>{a.title}</span>
                <span className={styles.count}>{a.next ? `${Math.min(a.value, a.next)} / ${a.next}` : 'Maxed out'}</span>
              </div>
              <div className={styles.track}>
                <div className={styles.fill} style={{ width: `${Math.min(100, a.progress * 100)}%` }} />
              </div>
              <div className={styles.desc}>
                {a.next ? `Reach ${a.next} ${a.unit}` : `Reached ${a.value} ${a.unit}`}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
