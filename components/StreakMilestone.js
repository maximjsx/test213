'use client'
import { useState } from 'react'
import Bear from './Bear'
import { useDialog } from '../hooks/useDialog'
import styles from './StreakMilestone.module.css'

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

// Square share card drawn on a canvas, so it works offline and needs no server
async function drawShareImage(days) {
  const size = 1080
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  const font = getComputedStyle(document.body).fontFamily

  ctx.fillStyle = '#121825'
  ctx.fillRect(0, 0, size, size)
  ctx.fillStyle = '#1a2438'
  ctx.beginPath()
  ctx.roundRect(80, 80, size - 160, size - 160, 60)
  ctx.fill()

  const fire = await loadImage('/icons/fire.png').catch(() => null)
  if (fire) ctx.drawImage(fire, size / 2 - 110, 190, 220, 220)

  ctx.textAlign = 'center'
  ctx.fillStyle = '#ff9600'
  ctx.font = `900 260px ${font}`
  ctx.fillText(String(days), size / 2, 660)
  ctx.fillStyle = '#e2ecfa'
  ctx.font = `900 72px ${font}`
  ctx.fillText('day streak', size / 2, 760)
  ctx.fillStyle = '#00bfa0'
  ctx.font = `800 48px ${font}`
  ctx.fillText('Learning Bulgarian on learn.bulgarian.dev', size / 2, 900)

  return new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
}

async function share(days) {
  const blob = await drawShareImage(days)
  if (!blob) return
  const file = new File([blob], `streak-${days}.png`, { type: 'image/png' })
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], text: `${days} day streak learning Bulgarian!` }).catch(() => {})
    return
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = file.name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export default function StreakMilestone({ days, onClose }) {
  const cardRef = useDialog(onClose)
  const [sharing, setSharing] = useState(false)

  return (
    <div className={styles.overlay}>
      <div className={styles.card} ref={cardRef} role="dialog" aria-modal="true" aria-labelledby="milestone-title">
        <Bear mood="cheer" size={110} />
        <div className={styles.flame}>
          <img src="/icons/fire.png" alt="" width={48} height={48} />
          <span className={styles.days}>{days}</span>
        </div>
        <h2 id="milestone-title" className={styles.title}>{days} day streak!</h2>
        <p className={styles.text}>You have practised Bulgarian {days} days in a row. That is a real habit now.</p>
        <button
          className={styles.shareBtn}
          disabled={sharing}
          onClick={async () => { setSharing(true); await share(days); setSharing(false) }}
        >
          {sharing ? 'PREPARING...' : 'SHARE'}
        </button>
        <button className={styles.continueBtn} onClick={onClose} data-autofocus>CONTINUE</button>
      </div>
    </div>
  )
}
