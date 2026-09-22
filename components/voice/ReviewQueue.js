'use client'
import { useEffect, useRef, useState } from 'react'
import { playUrl } from '../../lib/voiceStudio'
import styles from './Voice.module.css'

// Community takes waiting for a reviewer. Keyboard: Up/Down select (and play),
// Space replays, A approves, X rejects.
export default function ReviewQueue({ pending, approved, onDecide }) {
  const [index, setIndex] = useState(0)
  const rowRefs = useRef({})
  const stateRef = useRef(null)
  const current = Math.min(index, pending.length - 1)
  const selected = pending[current]

  stateRef.current = { pending, current, selected, onDecide }

  useEffect(() => {
    if (selected) rowRefs.current[selected.id]?.scrollIntoView({ block: 'nearest' })
  }, [selected])

  useEffect(() => {
    function select(step) {
      const { pending, current } = stateRef.current
      const next = Math.max(0, Math.min(pending.length - 1, current + step))
      setIndex(next)
      playUrl(pending[next]?.url)
    }
    function onKeyDown(e) {
      if (e.target?.tagName === 'INPUT' || e.metaKey || e.ctrlKey || e.altKey) return
      const { selected, onDecide } = stateRef.current
      const handlers = {
        ArrowDown: () => select(1),
        ArrowUp: () => select(-1),
        Space: () => playUrl(selected?.url),
        KeyA: () => selected && onDecide(selected, 'approve'),
        KeyX: () => selected && onDecide(selected, 'reject'),
      }
      const handler = handlers[e.code]
      if (!handler) return
      e.preventDefault()
      handler()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  if (!pending.length) {
    return <div className={styles.emptyState}>Nothing waiting for review.</div>
  }

  return (
    <div className={styles.review}>
      <div className={styles.keys}>
        <span><kbd>Up</kbd> <kbd>Down</kbd> select and play</span>
        <span><kbd>Space</kbd> replay</span>
        <span><kbd>A</kbd> approve</span>
        <span><kbd>X</kbd> reject</span>
      </div>
      {pending.map(v => {
        const live = approved[v.key]
        return (
          <div
            key={v.id}
            ref={el => { rowRefs.current[v.id] = el }}
            className={`${styles.reviewRow} ${v === selected ? styles.reviewRowOn : ''}`}
            onClick={() => { setIndex(pending.indexOf(v)); playUrl(v.url) }}
          >
            <div className={styles.reviewMain}>
              <div className={styles.reviewText} lang="bg">{v.text}</div>
              <div className={styles.reviewMeta}>
                by {v.byName}{live ? `, replaces the take by ${live.byName}` : ''}
              </div>
            </div>
            <div className={styles.reviewBtns} onClick={e => e.stopPropagation()}>
              <button className={styles.smallBtn} onClick={() => playUrl(v.url)}>Play</button>
              {live && <button className={styles.smallBtn} onClick={() => playUrl(live.url)}>Current</button>}
              <button className={`${styles.smallBtn} ${styles.approveBtn}`} onClick={() => onDecide(v, 'approve')}>Approve</button>
              <button className={`${styles.smallBtn} ${styles.dangerBtn}`} onClick={() => onDecide(v, 'reject')}>Reject</button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
