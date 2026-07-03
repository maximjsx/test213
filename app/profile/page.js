'use client'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useProgress, peekLocalProgress, clearLocalProgress } from '../../hooks/useProgress'
import { useAuth } from '../../hooks/useAuth'
import Bear from '../../components/Bear'
import Chevron from '../../components/Chevron'
import InstallButton from '../../components/InstallButton'
import styles from './page.module.css'

function fmtDate(d) {
  if (!d) return '?'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

// Cached across mounts so a tab switch back to Profile can decide the convert
// screen without re-blocking on the /api/progress fetch each time.
let cachedServerProgress = undefined

function ProfileInner() {
  const { state, adoptAsAccount } = useProgress()
  const { user, refresh, logout } = useAuth()
  const params = useSearchParams()

  const [serverProgress, setServerProgress] = useState(cachedServerProgress)
  const [localSnapshot, setLocalSnapshot] = useState(null)
  const [friendsData, setFriendsData] = useState(null)
  const [nameEdit, setNameEdit] = useState(null)
  const [nameError, setNameError] = useState('')
  const [saving, setSaving] = useState(false)
  const [convertPhase, setConvertPhase] = useState('idle') // idle | running | done
  const [convertPct, setConvertPct] = useState(0)
  const [convertSkipped, setConvertSkipped] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const oauthError = params.get('error')

  // Fetch the account copy of progress once signed in. This is only used to
  // decide which screen to show (convert vs normal profile) — useProgress
  // itself already loaded the account copy as `state` when one exists.
  useEffect(() => {
    if (!user) return
    fetch('/api/progress')
      .then(r => r.json())
      .then(d => { cachedServerProgress = d.progress ?? null; setServerProgress(cachedServerProgress) })
      .catch(() => { cachedServerProgress = null; setServerProgress(null) })
  }, [user])

  // Read-only peek at this browser's local storage, purely to show an
  // informational note. Never merged into the account automatically.
  useEffect(() => { setLocalSnapshot(peekLocalProgress()) }, [])

  function loadFriends() {
    fetch('/api/friends')
      .then(r => r.ok ? r.json() : null)
      .then(setFriendsData)
      .catch(() => {})
  }
  useEffect(() => { if (user) loadFriends() }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  async function friendAction(username, action) {
    await fetch('/api/friends', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, action }),
    }).catch(() => {})
    loadFriends()
  }

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
        adoptAsAccount(state)
        clearLocalProgress()
        setLocalSnapshot(null)
        setTimeout(() => { setServerProgress(state); setConvertPhase('done') }, 350)
      })
      .catch(() => {
        clearInterval(timer)
        setConvertPhase('idle')
        setNameError('')
        alert('Could not save your progress, please try again.')
      })
  }

  async function deleteAccount() {
    setDeleting(true)
    try {
      const res = await fetch('/api/account', { method: 'DELETE' })
      if (res.ok) {
        window.location.href = '/'
        return
      }
    } finally {
      setDeleting(false)
    }
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

  const lessonsDone = Object.keys(state.lessons).length
  const localHasProgress = state.xp > 0 || lessonsDone > 0

  // Render immediately — the stat numbers come from `state`, which starts at 0
  // and fills in as progress hydrates (cached across tab switches, so it's
  // usually already populated). We only hold back in two narrow cases where we
  // genuinely can't pick the right screen yet:
  //  - auth still unknown on the very first load (would flash signed-out UI)
  //  - a signed-in user who might be a first-time converter: we must know the
  //    account copy (serverProgress) before offering the convert screen
  if (user === undefined) return null
  if (user && serverProgress === undefined && localHasProgress) return null

  // Purely informational: this account already has its own progress, and this
  // browser separately has local progress that was never linked to it. It's
  // never touched or merged automatically.
  const localLessonsDone = localSnapshot ? Object.keys(localSnapshot.lessons || {}).length : 0
  const localDiffersFromAccount = user && serverProgress && localSnapshot
    && (localSnapshot.xp > 0 || localLessonsDone > 0)
    && (localSnapshot.xp !== state.xp || localLessonsDone !== lessonsDone)

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

      <div className={user ? styles.hero : styles.card}>
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

            <div className={styles.statsHeading}>Statistics</div>
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

            {friendsData && (friendsData.incoming.length > 0 || friendsData.friends.length > 0 || friendsData.outgoing.length > 0) && (
              <div className={styles.friendsSection}>
                {friendsData.incoming.length > 0 && (
                  <>
                    <div className={styles.friendsLabel}>Friend requests</div>
                    {friendsData.incoming.map(f => (
                      <div key={f.username} className={styles.friendRow}>
                        <Link href={`/u/${f.username}`} className={styles.friendInfo}>
                          {f.avatarUrl
                            ? <img src={f.avatarUrl} alt="" className={styles.friendAvatar} width={34} height={34} />
                            : <span className={styles.friendAvatar}><Bear mood="idle" size={34} /></span>}
                          <span className={styles.friendName}>{f.username}</span>
                        </Link>
                        <div className={styles.friendBtns}>
                          <button className={styles.acceptBtn} onClick={() => friendAction(f.username, 'accept')}>ACCEPT</button>
                          <button className={styles.declineBtn} onClick={() => friendAction(f.username, 'decline')}>
                            <img src="/icons/gray_x.png" alt="decline" width={14} height={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </>
                )}
                {friendsData.friends.length > 0 && (
                  <>
                    <div className={styles.friendsLabel}>Friends · {friendsData.friends.length}</div>
                    {friendsData.friends.map(f => (
                      <Link key={f.username} href={`/u/${f.username}`} className={styles.friendRow}>
                        <span className={styles.friendInfo}>
                          {f.avatarUrl
                            ? <img src={f.avatarUrl} alt="" className={styles.friendAvatar} width={34} height={34} />
                            : <span className={styles.friendAvatar}><Bear mood="idle" size={34} /></span>}
                          <span className={styles.friendName}>{f.username}</span>
                          {f.streak >= 3 && (
                            <span className={styles.friendStreak}><img src="/icons/fire.png" alt="" width={13} height={13} />{f.streak}</span>
                          )}
                        </span>
                        <span className={styles.friendXp}>{f.xp} XP</span>
                      </Link>
                    ))}
                  </>
                )}
                {friendsData.outgoing.length > 0 && (
                  <>
                    <div className={styles.friendsLabel}>Sent requests</div>
                    {friendsData.outgoing.map(f => (
                      <div key={f.username} className={styles.friendRow}>
                        <Link href={`/u/${f.username}`} className={styles.friendInfo}>
                          {f.avatarUrl
                            ? <img src={f.avatarUrl} alt="" className={styles.friendAvatar} width={34} height={34} />
                            : <span className={styles.friendAvatar}><Bear mood="idle" size={34} /></span>}
                          <span className={styles.friendName}>{f.username}</span>
                        </Link>
                        <button className={styles.declineBtn} onClick={() => friendAction(f.username, 'cancel')} title="Cancel request">
                          <img src="/icons/gray_x.png" alt="cancel" width={14} height={14} />
                        </button>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}

            {localDiffersFromAccount && (
              <div className={styles.localNote}>
                <div className={styles.localNoteTitle}>Local device stats</div>
                <div className={styles.localNoteDetail}>
                  This browser also has {localSnapshot.xp} XP and {localLessonsDone} lessons stored outside
                  your account. It's kept separate and untouched.
                </div>
              </div>
            )}

            <InstallButton />

            <button className={styles.logoutBtn} onClick={logout}>SIGN OUT</button>

            <div className={styles.dangerZone}>
              {!confirmDelete ? (
                <button className={styles.deleteBtn} onClick={() => setConfirmDelete(true)}>Delete account</button>
              ) : (
                <div className={styles.deleteConfirm}>
                  <div className={styles.deleteConfirmText}>
                    This permanently deletes your account, progress, and friends. This cannot be undone.
                  </div>
                  <div className={styles.deleteConfirmBtns}>
                    <button className={styles.deleteConfirmBtn} onClick={deleteAccount} disabled={deleting}>
                      {deleting ? 'DELETING…' : 'YES, DELETE'}
                    </button>
                    <button className={styles.deleteCancelBtn} onClick={() => setConfirmDelete(false)} disabled={deleting}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
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

      {/* Mobile only: the global footer is hidden behind the tab bar there,
          so keep the legal links reachable from the Profile tab. */}
      <div className={styles.legalLinks}>
        <Link href="/privacy" className={styles.legalLink}>Privacy Policy</Link>
        <Link href="/legal" className={styles.legalLink}>Legal Notice</Link>
        <a href="https://discord.gg/gnuh77Dxgm" target="_blank" rel="noopener noreferrer" className={styles.legalLink}>Discord</a>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  return (
    <Suspense fallback={null}>
      <ProfileInner />
    </Suspense>
  )
}
