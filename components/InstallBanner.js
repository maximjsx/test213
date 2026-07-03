'use client'
import { useState, useEffect } from 'react'
import { useInstallPrompt } from '../hooks/useInstallPrompt'
import Bear from './Bear'
import styles from './InstallBanner.module.css'

const DISMISS_KEY = 'a2hs-dismissed-v1'

export default function InstallBanner() {
  const { ready, canPromptNative, ios, standalone, promptInstall } = useInstallPrompt()
  const [dismissed, setDismissed] = useState(true) // assume dismissed until we read storage
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try { setDismissed(localStorage.getItem(DISMISS_KEY) === '1') } catch { setDismissed(false) }
  }, [])

  // Small delay so it doesn't slam in on first paint
  useEffect(() => {
    if (!ready || dismissed || standalone) return
    if (!canPromptNative && !ios) return
    const t = setTimeout(() => setVisible(true), 2500)
    return () => clearTimeout(t)
  }, [ready, dismissed, standalone, canPromptNative, ios])

  function close() {
    setVisible(false)
    setDismissed(true)
    try { localStorage.setItem(DISMISS_KEY, '1') } catch {}
  }

  async function install() {
    const outcome = await promptInstall()
    // Whatever the user chose, we asked once — don't nag again
    close()
    return outcome
  }

  if (!visible) return null

  return (
    <div className={styles.wrap} role="dialog" aria-label="Install app">
      <button className={styles.close} onClick={close} aria-label="Dismiss">
        <img src="/icons/gray_x.png" alt="" width={16} height={16} />
      </button>
      <div className={styles.bear}><Bear mood="happy" size={52} /></div>
      <div className={styles.body}>
        <div className={styles.title}>Add to Home Screen</div>
        {ios ? (
          <div className={styles.text}>
            Tap the Share button, then <b>Add to Home Screen</b> to install the app.
          </div>
        ) : (
          <div className={styles.text}>
            Install Learn Bulgarian for a full-screen, app-like experience.
          </div>
        )}
      </div>
      {!ios && canPromptNative && (
        <button className={styles.installBtn} onClick={install}>INSTALL</button>
      )}
    </div>
  )
}
