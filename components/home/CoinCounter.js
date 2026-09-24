'use client'
import { useEffect, useRef, useState } from 'react'
import CoinIcon from '../ui/CoinIcon'
import styles from './HomeStats.module.css'
import own from './CoinCounter.module.css'

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

export default function CoinCounter({ coins }) {
  const display = useCountUp(coins)
  const [delta, setDelta] = useState(null)
  const prevRef = useRef(coins)
  useEffect(() => {
    if (coins > prevRef.current) {
      // Keyed by value so React remounts the badge and the float animation
      // replays even on back-to-back gains.
      setDelta({ amount: coins - prevRef.current, key: Date.now() })
      const t = setTimeout(() => setDelta(null), 1200)
      prevRef.current = coins
      return () => clearTimeout(t)
    }
    prevRef.current = coins
  }, [coins])
  return (
    <span className={own.counter}>
      <CoinIcon size={24} />
      <span className={styles.num}>{display}</span>
      {delta && <span key={delta.key} className={own.delta}>+{delta.amount}</span>}
    </span>
  )
}
