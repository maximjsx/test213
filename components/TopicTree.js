'use client'
import Link from 'next/link'
import { hapticTap } from '../lib/audio'
import TopicArt from './TopicArt'
import styles from './TopicTree.module.css'

const RING_R = 56
const RING_LEN = 2 * Math.PI * RING_R

// First topic on its own, then pairs, like the old Duolingo tree.
function treeRows(levels) {
  const rows = [levels.slice(0, 1)]
  for (let i = 1; i < levels.length; i += 2) rows.push(levels.slice(i, i + 2))
  return rows
}

function TopicBubble({ level, done, total, isResume }) {
  const complete = total > 0 && done === total
  const ringColor = complete ? 'var(--yellow)' : level.color
  return (
    <Link href={`/topic/${level.id}`} className={styles.bubble} onPointerDown={hapticTap}>
      {isResume && <span className={styles.startLabel}>{done > 0 ? 'Continue' : 'Start'}</span>}
      <span className={styles.ringWrap}>
        <svg className={styles.ring} viewBox="0 0 120 120" aria-hidden="true">
          <circle cx="60" cy="60" r={RING_R} className={styles.ringTrack} />
          {done > 0 && (
            <circle
              cx="60" cy="60" r={RING_R}
              className={styles.ringFill}
              stroke={ringColor}
              strokeDasharray={RING_LEN}
              strokeDashoffset={RING_LEN * (1 - done / total)}
            />
          )}
        </svg>
        <span className={styles.disc} style={{ background: level.color }}>
          <TopicArt level={level} size={62} />
        </span>
        <span className={`${styles.count} ${complete ? styles.countDone : ''}`}>
          {complete ? <img src="/icons/star.png" alt="" width={14} height={14} /> : null}
          {done}/{total}
        </span>
      </span>
      <span className={styles.title}>{level.title}</span>
    </Link>
  )
}

export default function TopicTree({ levels, levelProgress, resumeLevelId }) {
  return (
    <div className={styles.tree}>
      {treeRows(levels).map(row => (
        <div key={row[0].id} className={styles.row}>
          {row.map(level => {
            const { done, total } = levelProgress(level.lessons)
            return <TopicBubble key={level.id} level={level} done={done} total={total} isResume={level.id === resumeLevelId} />
          })}
        </div>
      ))}
    </div>
  )
}
