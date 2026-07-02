'use client'
import { useState } from 'react'
import { dayKey } from '../hooks/useProgress'
import Chevron from './Chevron'
import styles from './StreakModal.module.css'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

export default function StreakModal({ state, onClose }) {
  const now = new Date()
  const [view, setView] = useState({ y: now.getFullYear(), m: now.getMonth() })
  const activeDays = state.activeDays || {}

  const first = new Date(view.y, view.m, 1)
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate()
  const startOffset = (first.getDay() + 6) % 7 // Monday first
  const todayKey = dayKey()
  const isCurrentMonth = view.y === now.getFullYear() && view.m === now.getMonth()

  const cells = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  function shiftMonth(delta) {
    setView(v => {
      const d = new Date(v.y, v.m + delta, 1)
      return { y: d.getFullYear(), m: d.getMonth() }
    })
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.card} onClick={e => e.stopPropagation()}>
        <button className={styles.close} onClick={onClose}><img src="/icons/gray_x.png" alt="✕" width={20} height={20} /></button>

        <div className={styles.hero}>
          <img src="/icons/fire.png" alt="" width={44} height={44} />
          <div>
            <div className={styles.streakNum}>{state.streak}</div>
            <div className={styles.streakLbl}>day streak</div>
          </div>
        </div>
        <div className={styles.freezes}>
          <img src="/icons/shield.png" alt="" width={16} height={16} />
          {state.streakFreezes || 0} streak {state.streakFreezes === 1 ? 'freeze' : 'freezes'} equipped
        </div>

        <div className={styles.monthNav}>
          <button className={styles.navBtn} onClick={() => shiftMonth(-1)}><Chevron size={15} /></button>
          <span className={styles.monthLabel}>{MONTHS[view.m]} {view.y}</span>
          <button className={styles.navBtn} onClick={() => shiftMonth(1)} disabled={isCurrentMonth}><Chevron dir="right" size={15} /></button>
        </div>

        <div className={styles.grid}>
          {WEEKDAYS.map(w => <div key={w} className={styles.weekday}>{w}</div>)}
          {cells.map((d, i) => {
            if (d === null) return <div key={`e${i}`} />
            const key = dayKey(new Date(view.y, view.m, d))
            const status = activeDays[key]
            const isToday = key === todayKey
            return (
              <div
                key={key}
                className={`${styles.day} ${status === true ? styles.dayActive : ''} ${status === 'frozen' ? styles.dayFrozen : ''} ${isToday ? styles.dayToday : ''}`}
              >
                {d}
              </div>
            )
          })}
        </div>

        <div className={styles.legend}>
          <span><i className={`${styles.dot} ${styles.dotActive}`} /> practiced</span>
          <span><i className={`${styles.dot} ${styles.dotFrozen}`} /> freeze used</span>
        </div>
      </div>
    </div>
  )
}
