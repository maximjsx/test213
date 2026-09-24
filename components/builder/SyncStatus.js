'use client'
import { useEffect, useState } from 'react'
import { onSyncStatus } from '../../lib/builderStore'
import styles from './SyncStatus.module.css'

const LABELS = {
  saving: 'Saving',
  saved: 'Saved to your account',
  offline: 'Not backed up, saved in this browser',
}

export default function SyncStatus() {
  const [status, setStatus] = useState('idle')
  useEffect(() => onSyncStatus(setStatus), [])
  if (status === 'idle') return null
  return (
    <span className={`${styles.status} ${styles[status]}`} role="status">
      <span className={styles.dot} aria-hidden="true" />
      {LABELS[status]}
    </span>
  )
}
