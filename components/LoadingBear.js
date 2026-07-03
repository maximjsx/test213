'use client'
import { useEffect } from 'react'
import Bear from './Bear'
import styles from './LoadingBear.module.css'

// Duolingo-style loading screen: the mascot hops in place over a pulsing
// shadow while the label's dots bounce. Drop-in replacement for the plain
// "Loading…" divs; set fullscreen={false} to embed it inside a page section.
export default function LoadingBear({ label = 'Loading', size = 96, fullscreen = true }) {
  // The layout footer peeking out under the loader jumps around once the real
  // page renders; tag the body so globals.css can hide it while we're up
  useEffect(() => {
    if (!fullscreen) return
    document.body.setAttribute('data-loading', '')
    return () => document.body.removeAttribute('data-loading')
  }, [fullscreen])

  return (
    <div className={fullscreen ? styles.screen : styles.inline} role="status" aria-label={label}>
      <div className={styles.stage}>
        <div className={styles.hop}>
          <Bear mood="happy" size={size} />
        </div>
        <div className={styles.shadow} />
      </div>
      <div className={styles.label}>
        {label}
        <span className={styles.dots}>
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.dot} />
        </span>
      </div>
    </div>
  )
}
