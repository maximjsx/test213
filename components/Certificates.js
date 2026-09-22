'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CERTIFICATES, certificateProgress } from '../lib/certificates'
import styles from './Certificates.module.css'

const CLAIM_ERRORS = {
  invalid_name: 'Use 2 to 60 letters. Spaces, hyphens and apostrophes are fine.',
  not_complete: 'Your latest lessons have not synced to your account yet. Try again in a moment.',
  unauthorized: 'Sign in again to claim this certificate.',
}

function ClaimForm({ tier, defaultName }) {
  const router = useRouter()
  const [name, setName] = useState(defaultName || '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function claim(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: tier.id, name }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      router.push(`/certificate/${data.certificate.id}`)
    } catch (err) {
      setError(CLAIM_ERRORS[err.message] || 'Something went wrong. Please try again.')
      setBusy(false)
    }
  }

  return (
    <form className={styles.claimForm} onSubmit={claim}>
      <label className={styles.nameLabel} htmlFor={`cert-name-${tier.id}`}>Name on certificate</label>
      <input
        id={`cert-name-${tier.id}`}
        className={styles.nameInput}
        value={name}
        onChange={e => setName(e.target.value)}
        maxLength={60}
        placeholder="Your full name"
        autoComplete="name"
      />
      <p className={styles.nameHint}>This is printed and signed, so it can't be changed later.</p>
      {error && <p className={styles.error}>{error}</p>}
      <button className={styles.claimBtn} disabled={busy || name.trim().length < 2}>
        {busy ? 'Signing...' : 'Claim certificate'}
      </button>
    </form>
  )
}

function CertificateAction({ tier, progress, issued, user }) {
  const [claiming, setClaiming] = useState(false)

  if (issued) {
    return <Link href={`/certificate/${issued.id}`} className={styles.viewBtn}>View certificate</Link>
  }
  if (!progress.complete) {
    return (
      <div className={styles.progressWrap}>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${(progress.done / progress.total) * 100}%` }} />
        </div>
        <span className={styles.progressText}>{progress.done} / {progress.total} lessons</span>
      </div>
    )
  }
  if (!user) {
    return <Link href="/profile" className={styles.signInBtn}>Sign in to claim</Link>
  }
  if (!claiming) {
    return <button className={styles.claimBtn} onClick={() => setClaiming(true)}>Claim certificate</button>
  }
  return <ClaimForm tier={tier} defaultName={user.discordName} />
}

export default function Certificates({ lessons, user }) {
  const [issued, setIssued] = useState({})

  useEffect(() => {
    if (!user) return
    fetch('/api/certificates')
      .then(r => r.json())
      .then(d => setIssued(Object.fromEntries((d.certificates || []).map(c => [c.tier, c]))))
      .catch(() => {})
  }, [user])

  return (
    <div className={styles.list}>
      {CERTIFICATES.map(tier => {
        const progress = certificateProgress(tier, lessons)
        const earned = !!issued[tier.id]
        return (
          <div key={tier.id} className={`${styles.card} ${earned ? styles.cardEarned : ''} ${!progress.complete && !earned ? styles.cardLocked : ''}`}>
            <div className={styles.seal}>{tier.seal}</div>
            <div className={styles.body}>
              <div className={styles.level}>{tier.level}</div>
              <div className={styles.title}>{tier.title}</div>
              <div className={styles.blurb}>{tier.blurb}</div>
              <CertificateAction tier={tier} progress={progress} issued={issued[tier.id]} user={user} />
            </div>
          </div>
        )
      })}
      <p className={styles.footnote}>
        Every certificate is a digitally signed PDF with a QR code that links back here, so anyone can check it is real.
      </p>
    </div>
  )
}
