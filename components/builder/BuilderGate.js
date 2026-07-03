'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import styles from './BuilderGate.module.css'

// Wraps builder pages. Only renders children once the signed-in Discord user is
// on the builder allowlist. Otherwise shows a login / no-access screen.
export default function BuilderGate({ children }) {
  const [state, setState] = useState({ status: 'loading' })

  useEffect(() => {
    let alive = true
    fetch('/api/builder/access')
      .then(r => r.json())
      .then(d => { if (alive) setState({ status: 'done', ...d }) })
      .catch(() => { if (alive) setState({ status: 'error' }) })
    return () => { alive = false }
  }, [])

  if (state.status === 'loading') {
    return <div className={styles.gate}><div className={styles.card}><div className={styles.text}>Loading…</div></div></div>
  }

  if (state.status === 'done' && state.allowed) {
    return children
  }

  // Not allowed → login or no-access
  return (
    <div className={styles.gate}>
      <div className={styles.card}>
        {!state.loggedIn ? (
          <>
            <div className={styles.emoji}>🔒</div>
            <h1 className={styles.title}>Log in to build levels</h1>
            <p className={styles.text}>The Level Builder is only available to authorized accounts. Sign in with Discord to continue.</p>
            <a className={styles.loginBtn} href="/api/auth/login">Log in with Discord</a>
          </>
        ) : (
          <>
            <div className={styles.emoji}>🚧</div>
            <h1 className={styles.title}>No builder access</h1>
            <p className={styles.text}>Your account isn't on the builder allowlist yet. Ask the admin to add your Discord ID:</p>
            {state.myId && <div className={styles.idBox}>{state.myId}</div>}
          </>
        )}
        <Link href="/" className={styles.backLink}>← Back to home</Link>
      </div>
    </div>
  )
}
