'use client'
import { useRef, useState } from 'react'
import { latinToCyrillic } from '../../lib/latinToCyrillic'
import Button from '../ui/Button'
import styles from './Converter.module.css'

const EXAMPLE = `Zdravey! Kak si? Az sum dobre, blagodarq.
Kyde e nay-blizkiqt magazin? Iskam da kupq hlqb i mlqko.
Toy kaza, che shte doyde utre.`

export default function Converter() {
  const [latin, setLatin] = useState('')
  const [copied, setCopied] = useState(false)
  const inputRef = useRef(null)
  const cyrillic = latinToCyrillic(latin)

  function change(text) {
    setLatin(text)
    setCopied(false)
  }

  async function paste() {
    try {
      change(await navigator.clipboard.readText())
    } catch {
      // Some browsers never allow reading the clipboard; Ctrl+V still works
      inputRef.current?.focus()
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(cyrillic)
    setCopied(true)
  }

  return (
    <div className={styles.converter}>
      <section className={styles.panel}>
        <label htmlFor="latin" className={styles.label}>Latin letters</label>
        <textarea
          id="latin"
          ref={inputRef}
          className={styles.text}
          value={latin}
          onChange={e => change(e.target.value)}
          placeholder="Kak si? Az sum dobre."
          autoFocus
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
        />
        <div className={styles.actions}>
          <Button variant="secondary" size="sm" onClick={paste}>Paste</Button>
          <Button variant="ghost" size="sm" onClick={() => change(EXAMPLE)}>Example</Button>
          <Button variant="ghost" size="sm" onClick={() => change('')} disabled={!latin}>Clear</Button>
        </div>
      </section>

      <section className={styles.panel}>
        <label htmlFor="cyrillic" className={styles.label}>Cyrillic</label>
        <textarea id="cyrillic" className={`${styles.text} ${styles.output}`} value={cyrillic} readOnly lang="bg" placeholder="Как си? Аз съм добре." />
        <div className={styles.actions}>
          <Button size="sm" onClick={copy} disabled={!cyrillic}>{copied ? 'Copied' : 'Copy'}</Button>
        </div>
      </section>
    </div>
  )
}
