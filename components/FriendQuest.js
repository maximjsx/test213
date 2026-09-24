'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Bear from './Bear'
import { hapticTap } from '../lib/audio'
import styles from './QuestsModal.module.css'

function Avatar({ url, size = 30 }) {
  return url
    ? <img src={url} alt="" className={styles.fqAvatar} width={size} height={size} />
    : <span className={styles.fqAvatar}><Bear mood="idle" size={size} /></span>
}

// Weekly shared goal with one friend, shown under the daily quests
export default function FriendQuest({ myAvatarUrl, claimedWeek, onClaim }) {
  const [data, setData] = useState(null)
  const [picking, setPicking] = useState(false)

  function load() {
    fetch('/api/friend-quest')
      .then(r => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => {})
  }
  useEffect(load, [])

  async function pick(username) {
    setPicking(false)
    await fetch('/api/friend-quest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    }).catch(() => {})
    load()
  }

  if (!data) return null

  const heading = <div className={styles.fqHeading}>Friend quest this week</div>

  if (!data.friends.length) {
    return (
      <>
        {heading}
        <p className={styles.fqText}>
          Add a friend from their profile page, then team up to earn {data.goal} XP together each week.
        </p>
      </>
    )
  }

  if (!data.partner || picking) {
    return (
      <>
        {heading}
        <p className={styles.fqText}>Pick a friend and earn {data.goal} XP together by Sunday.</p>
        <div className={styles.fqPickList}>
          {data.friends.map(f => (
            <button key={f.username} className={styles.fqPick} onClick={() => pick(f.username)}>
              <Avatar url={f.avatarUrl} />
              <span>{f.username}</span>
            </button>
          ))}
        </div>
      </>
    )
  }

  const total = data.myXp + data.partner.xp
  const done = total >= data.goal
  const claimed = claimedWeek === data.week
  return (
    <>
      {heading}
      <div className={`${styles.quest} ${claimed ? styles.questClaimed : ''}`}>
        <div className={styles.fqPair}>
          <Avatar url={myAvatarUrl} size={26} />
          <Avatar url={data.partner.avatarUrl} size={26} />
        </div>
        <div className={styles.questBody}>
          <div className={styles.questTitle}>
            Earn {data.goal} XP with <Link href={`/u/${data.partner.username}`} className={styles.fqName}>{data.partner.username}</Link>
          </div>
          <div className={styles.track}>
            <div className={styles.fill} style={{ width: `${Math.min(100, (total / data.goal) * 100)}%` }} />
            <span className={styles.trackLabel}>{Math.min(total, data.goal)} / {data.goal}</span>
          </div>
          <div className={styles.fqSplit}>You {data.myXp} XP · {data.partner.username} {data.partner.xp} XP</div>
        </div>
        {claimed ? (
          <div className={styles.claimedTag}><img src="/icons/green_checkmark.png" alt="Claimed" width={16} height={16} /></div>
        ) : done ? (
          <button className={styles.claimBtn} onClick={() => { hapticTap(); onClaim(data.week, data.reward) }}>+{data.reward} XP</button>
        ) : (
          <div className={styles.rewardTag}><img src="/icons/lightning.png" alt="" width={14} height={14} />{data.reward}</div>
        )}
      </div>
      {!done && (
        <button className={styles.fqChange} onClick={() => setPicking(true)}>Change partner</button>
      )}
    </>
  )
}
