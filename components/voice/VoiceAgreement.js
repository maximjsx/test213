'use client'
import { useState } from 'react'
import Link from 'next/link'
import { acceptVoiceAgreement } from '../../lib/voiceStudio'
import styles from './Voice.module.css'

export default function VoiceAgreement({ onAccept }) {
  const [checked, setChecked] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function accept() {
    setSaving(true)
    setError('')
    try {
      await acceptVoiceAgreement()
      onAccept()
    } catch {
      setError('Could not save that. Try again.')
      setSaving(false)
    }
  }

  return (
    <div className={styles.signIn}>
      <img src="/icons/microphone.png" alt="" width={56} height={56} />
      <h1 className={styles.signInTitle}>Before you record</h1>
      <ul className={styles.agreementList}>
        <li>Your recordings play in the lessons, and your username is shown as the speaker.</li>
        <li>You give Learn Bulgarian a permanent, irrevocable, free license to use, edit and publish them.</li>
        <li>If you delete your account, approved recordings stay in the course and your name is removed from them.</li>
      </ul>
      <label className={styles.agreementCheck}>
        <input type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)} />
        <span>
          I am 18 or older, or have a parent&apos;s permission, and I agree to the{' '}
          <Link href="/terms#recordings" target="_blank">voice contribution terms</Link>.
        </span>
      </label>
      {error && <p className={styles.agreementError} role="alert">{error}</p>}
      <button className={styles.agreementBtn} onClick={accept} disabled={!checked || saving}>
        {saving ? 'Saving...' : 'Start recording'}
      </button>
    </div>
  )
}
