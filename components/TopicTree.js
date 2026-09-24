'use client'
import Link from 'next/link'
import { hapticTap } from '../lib/audio'
import TopicArt from './TopicArt'
import CoinIcon from './ui/CoinIcon'
import DiscordIcon from './ui/DiscordIcon'
import styles from './TopicTree.module.css'

const RING_R = 56
const RING_LEN = 2 * Math.PI * RING_R

// The path winds left and right like a trail. Offsets in px from the centre.
const OFFSETS = [0, 56, 84, 56, 0, -56, -84, -56]
const CONNECTOR_W = 240
const CONNECTOR_H = 44

const offsetAt = i => OFFSETS[i % OFFSETS.length]

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12.5 10 17.5 19 7" />
    </svg>
  )
}

function Connector({ from, to, state }) {
  const x1 = CONNECTOR_W / 2 + from
  const x2 = CONNECTOR_W / 2 + to
  const mid = CONNECTOR_H / 2
  return (
    <svg className={`${styles.connector} ${styles[state]}`} width={CONNECTOR_W} height={CONNECTOR_H} viewBox={`0 0 ${CONNECTOR_W} ${CONNECTOR_H}`} aria-hidden="true">
      <path d={`M${x1} 0 C${x1} ${mid} ${x2} ${mid} ${x2} ${CONNECTOR_H}`} />
    </svg>
  )
}

function Ring({ done, total, complete }) {
  return (
    <svg className={styles.ring} viewBox="0 0 120 120" aria-hidden="true">
      <circle cx="60" cy="60" r={RING_R} className={styles.ringTrack} />
      {done > 0 && (
        <circle
          cx="60" cy="60" r={RING_R}
          className={`${styles.ringFill} ${complete ? styles.ringDone : ''}`}
          strokeDasharray={RING_LEN}
          strokeDashoffset={RING_LEN * (1 - done / total)}
        />
      )}
    </svg>
  )
}

function TopicStop({ level, done, total, isResume }) {
  const complete = total > 0 && done === total
  const state = complete ? styles.done : isResume ? styles.current : ''
  return (
    <Link href={`/topic/${level.id}`} className={`${styles.bubble} ${state}`} style={{ '--topic': level.color }} onPointerDown={hapticTap}>
      {isResume && <span className={styles.startLabel}>{done > 0 ? 'Continue' : 'Start'}</span>}
      <span className={styles.ringWrap}>
        <Ring done={done} total={total} complete={complete} />
        <span className={styles.disc} style={{ background: level.color }}>
          <TopicArt level={level} size={62} />
        </span>
        <span className={styles.count}>
          {complete ? <><CheckIcon /> Done</> : `${done}/${total}`}
        </span>
      </span>
      <span className={styles.title}>{level.title}</span>
    </Link>
  )
}

function LockedStop({ level, lock, onUnlock }) {
  const { guild, price } = level.special
  const label = lock.needsGuild
    ? `Locked special topic for members of ${guild.name}`
    : `Locked special topic, unlock for ${price} coins`
  return (
    <button
      type="button"
      className={`${styles.bubble} ${styles.locked}`}
      onClick={() => { hapticTap(); onUnlock(level) }}
      aria-label={`${level.title}. ${label}`}
    >
      <span className={styles.ringWrap}>
        <Ring done={0} total={1} />
        <span className={styles.disc}>
          <img src="/icons/lock.png" alt="" width={44} height={44} />
        </span>
        <span className={styles.count}>
          {lock.needsGuild ? <><DiscordIcon size={15} /> Members</> : <><CoinIcon size={14} />{price}</>}
        </span>
      </span>
      <span className={styles.title}>{level.title}</span>
    </button>
  )
}

export default function TopicTree({ levels, levelProgress, resumeLevelId, lockOf, onUnlock }) {
  const stops = levels.map(level => {
    const lock = lockOf(level)
    const { done, total } = levelProgress(level.lessons)
    return { level, lock, done, total, complete: !lock && total > 0 && done === total }
  })

  return (
    <ol className={styles.path}>
      {stops.map(({ level, lock, done, total }, i) => {
        const lineState = i > 0 && stops[i - 1].complete ? 'lineDone' : lock ? 'lineLocked' : 'lineOpen'
        return (
          <li key={level.id} className={styles.stop}>
            {i > 0 && <Connector from={offsetAt(i - 1)} to={offsetAt(i)} state={lineState} />}
            <div style={{ transform: `translateX(${offsetAt(i)}px)` }}>
              {lock
                ? <LockedStop level={level} lock={lock} onUnlock={onUnlock} />
                : <TopicStop level={level} done={done} total={total} isResume={level.id === resumeLevelId} />}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
