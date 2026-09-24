'use client'
import { useState } from 'react'
import { DAILY_GOALS, DEFAULT_DAILY_GOAL } from '../lib/goals'
import { dayKey } from '../hooks/useProgress'
import Modal, { ModalText } from './ui/Modal'
import Button from './ui/Button'
import CoinIcon from './ui/CoinIcon'
import styles from './DailyGoal.module.css'

function GoalPicker({ current, onPick, onClose }) {
  return (
    <Modal title="Pick a daily goal" onClose={onClose} size="sm">
      <ModalText>How many coins do you want to earn each day?</ModalText>
      <div className={styles.options}>
        {DAILY_GOALS.map(g => (
          <button
            key={g.coins}
            className={`${styles.option} ${g.coins === current ? styles.optionActive : ''}`}
            onClick={() => { onPick(g.coins); onClose() }}
            aria-pressed={g.coins === current}
            data-autofocus={g.coins === current ? '' : undefined}
          >
            <span className={styles.optionLabel}>{g.label}</span>
            <span className={styles.optionCoins}><CoinIcon size={16} />{g.coins} a day</span>
          </button>
        ))}
      </div>
    </Modal>
  )
}

export default function DailyGoal({ state, setDailyGoal, className = '' }) {
  const [picking, setPicking] = useState(false)
  const goal = state.dailyGoal || DEFAULT_DAILY_GOAL
  const today = state.coinsByDay?.[dayKey()] || 0
  const reached = today >= goal

  return (
    <section className={`${styles.goal} ${reached ? styles.goalReached : ''} ${className}`}>
      <img src={reached ? '/icons/party_popper.png' : '/icons/lightning.png'} alt="" width={28} height={28} />
      <div className={styles.body}>
        <div className={styles.row}>
          <span className={styles.label}>{reached ? 'Daily goal reached' : 'Daily goal'}</span>
          <span className={styles.count}>{Math.min(today, goal)} / {goal} coins</span>
        </div>
        <div className={styles.track} role="progressbar" aria-valuemin={0} aria-valuemax={goal} aria-valuenow={Math.min(today, goal)} aria-label="Daily goal progress">
          <div className={styles.fill} style={{ width: `${Math.min(100, (today / goal) * 100)}%` }} />
        </div>
      </div>
      <Button variant="secondary" size="sm" onClick={() => setPicking(true)}>Change</Button>
      {picking && <GoalPicker current={goal} onPick={setDailyGoal} onClose={() => setPicking(false)} />}
    </section>
  )
}
