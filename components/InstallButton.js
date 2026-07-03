'use client'
import { useState } from 'react'
import { useInstallPrompt } from '../hooks/useInstallPrompt'
import styles from './InstallButton.module.css'

// Manual install entry point for the Profile tab. Mirrors the auto banner but
// is always available (until the app is actually installed).
export default function InstallButton() {
  const { ready, canPromptNative, ios, standalone, promptInstall } = useInstallPrompt()
  const [showHint, setShowHint] = useState(false)

  if (!ready || standalone) return null // nothing to do once it's installed

  async function handleClick() {
    if (canPromptNative) { await promptInstall(); return }
    // iOS Safari and browsers without the native prompt: show instructions
    setShowHint(v => !v)
  }

  return (
    <div className={styles.wrap}>
      <button className={styles.btn} onClick={handleClick}>
        <img src="/icons/bulgarian_flag.png" alt="" width={20} height={20} />
        Add to Home Screen
      </button>
      {showHint && (
        <div className={styles.hint}>
          {ios
            ? <>Tap the <b>Share</b> button in your browser, then choose <b>Add to Home Screen</b>.</>
            : <>Open your browser menu and choose <b>Install app</b> / <b>Add to Home Screen</b>.</>}
        </div>
      )}
    </div>
  )
}
