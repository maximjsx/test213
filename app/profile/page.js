'use client'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useProgress } from '../../hooks/useProgress'
import { useAuth } from '../../hooks/useAuth'
import Bear from '../../components/Bear'
import Chevron from '../../components/Chevron'
import styles from './page.module.css'

function fmtDate(d) {
  if (!d) return '?'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

function ProfileInner() {
  const { state, hydrated, replaceState } = useProgress()
  const { user, loading, refresh, logout } = useAuth()
  const params = useSearchParams()

  const [serverProgress, setServerProgress] = useState(undefined)
  const [nameEdit, setNameEdit] = useState(null)
  const [nameError, setNameError] = useState('')
  const [saving, setSaving] = useState(false)
  const [syncMsg, setSyncMsg] = useState('')
  const [convertPhase, setConvertPhase] = useState('idle') // idle | running | done
  const [convertPct, setConvertPct] = useState(0)
  const [convertSkipped, setConvertSkipped] = useState(false)

  const oauthError = params.get('error')

  // Fetch the account copy of progress once signed in
  useEffect(() => {
    if (!user) return
    fetch('/api/progress')
      .then(r => r.json())
      .then(d => setServerProgress(d.progress ?? null))
      .catch(() => setServerProgress(null))
  }, [user])

  // Returning users (account already has progress) are already converted,
  // fresh users with nothing local have nothing to convert: enable auto-sync
  useEffect(() => {
    if (!user || !hydrated || serverProgress === undefined) return
    const localHas = state.xp > 0 || Object.keys(state.lessons).length > 0
    if (serverProgress !== null || !localHas) {
      localStorage.setItem('bulgario_synced', '1')
    }
  }, [user, hydrated, serverProgress]) // eslint-disable-line react-hooks/exhaustive-deps

  function startConvert() {
    setConvertPhase('running')
    setConvertPct(0)

    const upload = fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ progress: state }),
    })

    // Bar eases toward 90% while the upload runs, then snaps to 100 on finish
    const started = Date.now()
    const timer = setInterval(() => {
      const t = (Date.now() - started) / 2200
      setConvertPct(Math.min(90, Math.round(90 * (1 - Math.pow(1 - Math.min(t, 1), 2)))))
    }, 50)

    Promise.all([upload, new Promise(r => setTimeout(r, 2300))])
      .then(([res]) => {
        clearInterval(timer)
        if (!res.ok) throw new Error('upload failed')
        setConvertPct(100)
        localStorage.setItem('bulgario_synced', '1')
        setTimeout(() => { setServerProgress(state); setConvertPhase('done') }, 350)
      })
      .catch(() => {
        clearInterval(timer)
        setConvertPhase('idle')
        setSyncMsg('')
        setNameError('')
        alert('Could not save your progress, please try again.')
      })
  }

  async function pushLocal(silent = false) {
    setSaving(true)
    try {
      const res = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress: state }),
      })
      if (res.ok) {
        setServerProgress(state)
        localStorage.setItem('bulgario_synced', '1')
        if (!silent) setSyncMsg('Progress saved to your account')
      }
    } finally {
      setSaving(false)
    }
  }

  async function pullServer() {
    if (!serverProgress) return
    replaceState(serverProgress)
    localStorage.setItem('bulgario_synced', '1')
    setSyncMsg('Account progress loaded on this device')
  }

  async function saveUsername() {
    setNameError('')
    setSaving(true)
    try {
      const res = await fetch('/api/username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: nameEdit }),
      })
      const data = await res.json()
      if (!res.ok) { setNameError(data.error || 'Could not save username'); return }
      setNameEdit(null)
      refresh()
    } finally {
      setSaving(false)
    }
  }

  // Signed in but the account copy hasn't arrived yet: keep loading, otherwise
  // the normal profile flashes before the convert screen can show
  if (!hydrated || loading || (user && serverProgress === undefined)) {
    return <div className={styles.loading}>Loading…</div>
  }

  const lessonsDone = Object.keys(state.lessons).length
  const localHasProgress = state.xp > 0 || lessonsDone > 0
  const outOfSync = user && serverProgress && (serverProgress.xp !== state.xp || Object.keys(serverProgress.lessons || {}).length !== lessonsDone)

  // First login with local progress: offer to convert it to the account
  const showConvert = user && !convertSkipped && localHasProgress
    && (convertPhase === 'done' || serverProgress === null)

  if (showConvert) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          {convertPhase === 'done' ? (
            <>
              <Bear mood="cheer" size={100} />
              <h1 className={styles.name}>Progress converted!</h1>
              <p className={styles.signinText}>
                Your progress now lives on your account and stays in sync automatically.
                Signing in on another device brings it with you.
              </p>
              <button className={styles.convertBtn} onClick={() => setConvertSkipped(true)}>
                GO TO PROFILE
              </button>
            </>
          ) : (
            <>
              <Bear mood="happy" size={100} />
              <h1 className={styles.name}>Welcome, {user.username}!</h1>
              <p className={styles.signinText}>
                You are signed in, but everything you earned so far is still saved only in this browser.
                Convert it to your account so it is backed up and counts on the leaderboard.
              </p>

              <div className={styles.stats}>
                <div className={styles.stat}>
                  <img src="/icons/lightning.png" alt="" width={22} height={22} />
                  <div className={styles.statVal}>{state.xp}</div>
                  <div className={styles.statLbl}>Total XP</div>
                </div>
                <div className={styles.stat}>
                  <img src="/icons/green_checkmark.png" alt="" width={22} height={22} />
                  <div className={styles.statVal}>{lessonsDone}</div>
                  <div className={styles.statLbl}>Lessons</div>
                </div>
                <div className={styles.stat}>
                  <img src="/icons/fire.png" alt="" width={22} height={22} />
                  <div className={styles.statVal}>{state.streak}</div>
                  <div className={styles.statLbl}>Day streak</div>
                </div>
                <div className={styles.stat}>
                  <img src="/icons/shield.png" alt="" width={22} height={22} />
                  <div className={styles.statVal}>{state.streakFreezes || 0}</div>
                  <div className={styles.statLbl}>Freezes</div>
                </div>
              </div>

              {convertPhase === 'running' ? (
                <div className={styles.convertBarWrap}>
                  <div className={styles.convertBar}>
                    <div className={styles.convertBarFill} style={{ width: `${convertPct}%` }} />
                  </div>
                  <div className={styles.convertBarLabel}>Converting… {convertPct}%</div>
                </div>
              ) : (
                <>
                  <button className={styles.convertBtn} onClick={startConvert}>
                    CONVERT PROGRESS
                  </button>
                  <button className={styles.convertSkip} onClick={() => setConvertSkipped(true)}>
                    Not now
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.topRow}>
        <Link href="/" className={styles.backBtn}><Chevron /> Course</Link>
        <Link href="/leaderboard" className={styles.lbLink}><img src="/icons/trophy.png" alt="" width={18} height={18} /> Leaderboard</Link>
      </div>

      <div className={styles.card}>
        {user ? (
          <>
            <div className={styles.avatarWrap}>
              {user.avatarUrl
                ? <img src={user.avatarUrl} alt="" className={styles.avatar} width={88} height={88} />
                : <Bear mood="happy" size={88} />}
            </div>

            {nameEdit === null ? (
              <div className={styles.nameRow}>
                <h1 className={styles.name}>{user.username}</h1>
                <button className={styles.editBtn} onClick={() => { setNameEdit(user.username); setNameError('') }}>edit</button>
              </div>
            ) : (
              <div className={styles.editRow}>
                <input
                  className={styles.nameInput}
                  value={nameEdit}
                  maxLength={20}
                  onChange={e => setNameEdit(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && saveUsername()}
                  autoFocus
                />
                <button className={styles.saveBtn} onClick={saveUsername} disabled={saving}>SAVE</button>
                <button className={styles.cancelBtn} onClick={() => setNameEdit(null)}>✕</button>
              </div>
            )}
            {nameError && <div className={styles.error}>{nameError}</div>}

            <div className={styles.joined}>Joined {fmtDate(user.createdAt)}</div>

            <div className={styles.stats}>
              <div className={styles.stat}>
                <img src="/icons/lightning.png" alt="" width={22} height={22} />
                <div className={styles.statVal}>{state.xp}</div>
                <div className={styles.statLbl}>Total XP</div>
              </div>
              <div className={styles.stat}>
                <img src="/icons/fire.png" alt="" width={22} height={22} />
                <div className={styles.statVal}>{state.streak}</div>
                <div className={styles.statLbl}>Day streak</div>
              </div>
              <div className={styles.stat}>
                <img src="/icons/green_checkmark.png" alt="" width={22} height={22} />
                <div className={styles.statVal}>{lessonsDone}</div>
                <div className={styles.statLbl}>Lessons</div>
              </div>
              <div className={styles.stat}>
                <img src="/icons/shield.png" alt="" width={22} height={22} />
                <div className={styles.statVal}>{state.streakFreezes || 0}</div>
                <div className={styles.statLbl}>Freezes</div>
              </div>
            </div>

            {outOfSync && (
              <div className={styles.syncBox}>
                <div className={styles.syncTitle}>This device and your account differ</div>
                <div className={styles.syncDetail}>
                  Device: {state.xp} XP, {lessonsDone} lessons · Account: {serverProgress.xp || 0} XP, {Object.keys(serverProgress.lessons || {}).length} lessons
                </div>
                <div className={styles.syncBtns}>
                  <button className={styles.syncBtn} onClick={() => pushLocal()} disabled={saving}>Upload this device</button>
                  <button className={styles.syncBtnAlt} onClick={pullServer} disabled={saving}>Load account copy</button>
                </div>
              </div>
            )}
            {syncMsg && <div className={styles.syncMsg}>{syncMsg}</div>}

            <button className={styles.logoutBtn} onClick={logout}>SIGN OUT</button>
          </>
        ) : (
          <>
            <Bear mood="happy" size={100} />
            <h1 className={styles.name}>Claim your account</h1>
            <p className={styles.signinText}>
              Your progress currently lives only in this browser. Sign in with Discord to back it up,
              use it on other devices and appear on the leaderboard.
            </p>
            {oauthError && <div className={styles.error}>Sign in failed ({oauthError}), please try again.</div>}
            <a href="/api/auth/login" className={styles.discordBtn}>
              <svg width="22" height="17" viewBox="0 0 71 55" fill="currentColor" aria-hidden="true">
                <path d="M60.1 4.9A58.5 58.5 0 0 0 45.4.4l-1.8 3.7a54 54 0 0 0-16.2 0L25.5.4a58.4 58.4 0 0 0-14.7 4.6C1.5 18.7-1 32.1.3 45.4a58.9 58.9 0 0 0 18 9.1l3.8-6.2a38 38 0 0 1-6-2.9l1.5-1.1a42 42 0 0 0 35.8 0l1.5 1.1a38 38 0 0 1-6 2.9l3.8 6.2a58.7 58.7 0 0 0 18-9.1c1.6-15.3-2.7-28.6-10.6-40.5ZM23.7 37.3c-3.5 0-6.4-3.2-6.4-7.2s2.8-7.2 6.4-7.2c3.6 0 6.5 3.3 6.4 7.2 0 4-2.8 7.2-6.4 7.2Zm23.6 0c-3.5 0-6.4-3.2-6.4-7.2s2.8-7.2 6.4-7.2c3.6 0 6.5 3.3 6.4 7.2 0 4-2.8 7.2-6.4 7.2Z"/>
              </svg>
              SIGN IN WITH DISCORD
            </a>
            <div className={styles.localStats}>
              On this device: {state.xp} XP · {lessonsDone} lessons · {state.streak} day streak
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className={styles.loading}>Loading…</div>}>
      <ProfileInner />
    </Suspense>
  )
}
