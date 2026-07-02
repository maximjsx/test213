'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Bear from '../../../components/Bear'
import Chevron from '../../../components/Chevron'
import styles from './page.module.css'

function fmtDate(d) {
  if (!d) return '?'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function PublicProfilePage() {
  const { username } = useParams()
  const [data, setData] = useState(undefined)
  const [busy, setBusy] = useState(false)

  function load() {
    fetch(`/api/user/${encodeURIComponent(username)}`)
      .then(r => r.ok ? r.json() : null)
      .then(setData)
      .catch(() => setData(null))
  }
  useEffect(load, [username]) // eslint-disable-line react-hooks/exhaustive-deps

  async function act(action) {
    setBusy(true)
    try {
      await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, action }),
      })
      load()
    } finally {
      setBusy(false)
    }
  }

  if (data === undefined) return <div className={styles.loading}>Loading…</div>

  if (!data?.user) {
    return (
      <div className={styles.page}>
        <div className={styles.topRow}>
          <Link href="/leaderboard" className={styles.backBtn}><Chevron /> Leaderboard</Link>
        </div>
        <div className={styles.card}>
          <Bear mood="sad" size={90} />
          <h1 className={styles.name}>User not found</h1>
          <p className={styles.subText}>No one goes by "{username}" here.</p>
        </div>
      </div>
    )
  }

  const { user, relationship } = data

  return (
    <div className={styles.page}>
      <div className={styles.topRow}>
        <Link href="/leaderboard" className={styles.backBtn}><Chevron /> Leaderboard</Link>
        <Link href="/profile" className={styles.profileLink}>My profile</Link>
      </div>

      <div className={styles.card}>
        {user.avatarUrl
          ? <img src={user.avatarUrl} alt="" className={styles.avatar} width={88} height={88} />
          : <Bear mood="happy" size={88} />}
        <h1 className={styles.name}>{user.username}</h1>
        <div className={styles.joined}>Joined {fmtDate(user.createdAt)}</div>

        <div className={styles.stats}>
          <div className={styles.stat}>
            <img src="/icons/lightning.png" alt="" width={22} height={22} />
            <div className={styles.statVal}>{user.xp}</div>
            <div className={styles.statLbl}>Total XP</div>
          </div>
          <div className={styles.stat}>
            <img src="/icons/fire.png" alt="" width={22} height={22} />
            <div className={styles.statVal}>{user.streak}</div>
            <div className={styles.statLbl}>Day streak</div>
          </div>
          <div className={styles.stat}>
            <img src="/icons/green_checkmark.png" alt="" width={22} height={22} />
            <div className={styles.statVal}>{user.lessonsCount}</div>
            <div className={styles.statLbl}>Lessons</div>
          </div>
        </div>

        <div className={styles.actions}>
          {relationship === 'self' && (
            <Link href="/profile" className={styles.primaryBtn}>THIS IS YOU, EDIT PROFILE</Link>
          )}
          {relationship === 'none' && (
            <button className={styles.primaryBtn} onClick={() => act('request')} disabled={busy}>ADD FRIEND</button>
          )}
          {relationship === 'outgoing' && (
            <button className={styles.mutedBtn} onClick={() => act('cancel')} disabled={busy}>REQUEST SENT · CANCEL</button>
          )}
          {relationship === 'incoming' && (
            <div className={styles.btnRow}>
              <button className={styles.primaryBtn} onClick={() => act('accept')} disabled={busy}>ACCEPT REQUEST</button>
              <button className={styles.mutedBtn} onClick={() => act('decline')} disabled={busy}>DECLINE</button>
            </div>
          )}
          {relationship === 'friends' && (
            <div className={styles.friendsRow}>
              <span className={styles.friendsTag}>
                <img src="/icons/green_checkmark.png" alt="" width={16} height={16} /> FRIENDS
              </span>
              <button className={styles.removeBtn} onClick={() => act('remove')} disabled={busy}>Remove</button>
            </div>
          )}
          {relationship === 'signed_out' && (
            <Link href="/profile" className={styles.mutedBtn}>SIGN IN TO ADD FRIENDS</Link>
          )}
        </div>
      </div>
    </div>
  )
}
