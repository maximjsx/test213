'use client'
import { useEffect, useRef, useState } from 'react'
import styles from './Home.module.css'

// Eased count-up so the number rolls to its new value instead of snapping.
// Starts already on `target`, so a fresh mount shows the real total with no
// distracting count-from-zero.
function useCountUp(target, duration = 650) {
  const [display, setDisplay] = useState(target)
  const fromRef = useRef(target)
  const rafRef = useRef(0)
  useEffect(() => {
    const from = fromRef.current
    if (from === target) return
    const start = performance.now()
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(Math.round(from + (target - from) * eased))
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
      else fromRef.current = target
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [target, duration])
  return display
}

export default function XpCounter({ xp }) {
  const display = useCountUp(xp)
  const [delta, setDelta] = useState(null)
  const prevRef = useRef(xp)
  useEffect(() => {
    if (xp > prevRef.current) {
      // Keyed by value so React remounts the badge and the float animation
      // replays even on back-to-back gains.
      setDelta({ amount: xp - prevRef.current, key: Date.now() })
      const t = setTimeout(() => setDelta(null), 1200)
      prevRef.current = xp
      return () => clearTimeout(t)
    }
    prevRef.current = xp
  }, [xp])
  return (
    <div className={styles.xp}>
      <span className={styles.xpIcon}><img src="/icons/lightning.png" alt="" width={24} height={24} /></span>
      <span className={styles.xpNum}>{display} XP</span>
      {delta && <span key={delta.key} className={styles.xpDelta}>+{delta.amount}</span>}
    </div>
  )
}
