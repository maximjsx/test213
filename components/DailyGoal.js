'use client'
import { useState } from 'react'
import { DAILY_GOALS, DEFAULT_DAILY_GOAL } from '../lib/goals'
import { dayKey } from '../hooks/useProgress'
import { useDialog } from '../hooks/useDialog'
import styles from './DailyGoal.module.css'

function GoalPicker({ current, onPick, onClose }) {
  const cardRef = useDialog(onClose)
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.card} ref={cardRef} role="dialog" aria-modal="true" aria-labelledby="goal-title" onClick={e => e.stopPropagation()}>
        <h2 id="goal-title" className={styles.title}>Pick a daily goal</h2>
        <p className={styles.sub}>How much XP do you want to earn each day?</p>
        <div className={styles.options}>
          {DAILY_GOALS.map(g => (
            <button
              key={g.xp}
              className={`${styles.option} ${g.xp === current ? styles.optionActive : ''}`}
              onClick={() => { onPick(g.xp); onClose() }}
              aria-pressed={g.xp === current}
              data-autofocus={g.xp === current ? '' : undefined}
            >
              <span className={styles.optionLabel}>{g.label}</span>
              <span className={styles.optionXp}>{g.xp} XP a day</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function DailyGoal({ state, setDailyGoal }) {
  const [picking, setPicking] = useState(false)
  const goal = state.dailyGoal || DEFAULT_DAILY_GOAL
  const today = state.xpByDay?.[dayKey()] || 0
  const reached = today >= goal

  return (
    <div className={`${styles.goal} ${reached ? styles.goalReached : ''}`}>
      <img src={reached ? '/icons/party_popper.png' : '/icons/lightning.png'} alt="" width={26} height={26} />
      <div className={styles.body}>
        <div className={styles.row}>
          <span className={styles.label}>{reached ? 'Daily goal reached' : 'Daily goal'}</span>
          <span className={styles.count}>{Math.min(today, goal)} / {goal} XP</span>
        </div>
        <div className={styles.track} role="progressbar" aria-valuemin={0} aria-valuemax={goal} aria-valuenow={Math.min(today, goal)} aria-label="Daily goal progress">
          <div className={styles.fill} style={{ width: `${Math.min(100, (today / goal) * 100)}%` }} />
        </div>
      </div>
      <button className={styles.change} onClick={() => setPicking(true)}>Change</button>
      {picking && <GoalPicker current={goal} onPick={setDailyGoal} onClose={() => setPicking(false)} />}
    </div>
  )
}
