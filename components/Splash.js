'use client'
import { useState, useEffect } from 'react'
import Bear from './Bear'
import styles from './Splash.module.css'

// Welcome splash shown once per full page load. It lives in the root layout, so
// Next keeps it mounted across client-side navigations — it only replays on a
// hard load / refresh, which is exactly "opening the website".
export default function Splash() {
  const [phase, setPhase] = useState('in') // in -> out -> gone

  useEffect(() => {
    const hold = setTimeout(() => setPhase('out'), 1400)
    const done = setTimeout(() => setPhase('gone'), 2100) // after the iris close
    return () => { clearTimeout(hold); clearTimeout(done) }
  }, [])

  if (phase === 'gone') return null

  return (
    <div className={`${styles.overlay} ${phase === 'out' ? styles.out : ''}`} aria-hidden="true">
      <div className={styles.stage}>
        <img src="/icons/bulgarian_flag.png" alt="" width={40} height={40} className={styles.flag} />
        <div className={styles.bear}><Bear mood="cheer" size={120} /></div>
        <div className={styles.title}>Learn Bulgarian</div>
        <div className={styles.tagline}>Добре дошли</div>
      </div>
    </div>
  )
}
