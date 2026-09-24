'use client'
import { useState } from 'react'
import Button from '../ui/Button'
import styles from './Wiki.module.css'

// Pages full of insults and swearing open only on request
export default function VulgarGate({ children }) {
  const [open, setOpen] = useState(false)
  if (open) return children
  return (
    <div className={styles.gate}>
      <p className={styles.gateTitle}>Contains vulgar language</p>
      <p className={styles.muted}>Insults and swear words, useful to recognise, risky to use. Know who you are talking to.</p>
      <Button variant="secondary" onClick={() => setOpen(true)}>Show the page</Button>
    </div>
  )
}
