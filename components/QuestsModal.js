'use client'
import Bear from './Bear'
import { hapticTap } from '../lib/audio'
import styles from './QuestsModal.module.css'

export default function QuestsModal({ quests, claimQuest, onClose }) {
  const items = quests?.items || []
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.card} onClick={e => e.stopPropagation()}>
        <button className={styles.close} onClick={onClose}><img src="/icons/gray_x.png" alt="✕" width={20} height={20} /></button>
        <div className={styles.bear}><Bear mood="happy" size={72} /></div>
        <h2 className={styles.title}>Daily Quests</h2>
        <p className={styles.sub}>New quests every day at midnight</p>

        {items.map(q => {
          const done = q.progress >= q.goal
          const pctWidth = Math.min(100, Math.round((q.progress / q.goal) * 100))
          return (
            <div key={q.id} className={`${styles.quest} ${q.claimed ? styles.questClaimed : ''}`}>
              <img className={styles.questIcon} src={q.icon} alt="" width={30} height={30} />
              <div className={styles.questBody}>
                <div className={styles.questTitle}>{q.title}</div>
                <div className={styles.track}>
                  <div className={styles.fill} style={{ width: `${pctWidth}%` }} />
                  <span className={styles.trackLabel}>{Math.min(q.progress, q.goal)} / {q.goal}</span>
                </div>
              </div>
              {q.claimed ? (
                <div className={styles.claimedTag}><img src="/icons/green_checkmark.png" alt="" width={16} height={16} /></div>
              ) : done ? (
                <button className={styles.claimBtn} onClick={() => { hapticTap(); claimQuest(q.id) }}>
                  +{q.reward.amount} {q.reward.type === 'xp' ? 'XP' : ''}
                  {q.reward.type === 'freeze' && <img src="/icons/shield.png" alt="freeze" width={16} height={16} />}
                </button>
              ) : (
                <div className={styles.rewardTag}>
                  {q.reward.type === 'xp'
                    ? <><img src="/icons/lightning.png" alt="" width={14} height={14} />{q.reward.amount}</>
                    : <><img src="/icons/shield.png" alt="" width={14} height={14} />1</>}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
