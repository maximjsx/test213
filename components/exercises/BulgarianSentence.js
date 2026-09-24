'use client'
import { useEffect, useRef, useState } from 'react'
import { VOCAB } from '../../lib/vocab'
import AddToDeckButton from '../decks/AddToDeckButton'
import styles from './BulgarianSentence.module.css'

export function parseWordHints(hint) {
  if (!hint) return {}
  const map = {}
  hint.split(',').forEach(part => {
    const eq = part.indexOf('=')
    if (eq === -1) return
    const bg = part.slice(0, eq).trim().toLowerCase()
    const en = part.slice(eq + 1).trim()
    if (bg && en) map[bg] = en
  })
  return map
}

// Hover shows the meaning; a tap or click pins it open with an add-to-deck
// button, which is also how phones (no hover) get the meaning at all.
function Word({ token, word, translation, open, onToggle }) {
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    // Clicks in the deck picker (a portalled modal) must not close the word
    const close = e => {
      if (ref.current?.contains(e.target) || e.target.closest?.('[aria-modal]')) return
      onToggle(false)
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [open, onToggle])

  return (
    <span ref={ref} className={`${styles.wordWrap} ${open ? styles.open : ''}`}>
      <button type="button" className={styles.word} onClick={() => onToggle(!open)} aria-expanded={open}>
        {token}
      </button>
      <span className={styles.tooltip} role={open ? 'dialog' : undefined} aria-label={open ? `Meaning of ${word}` : undefined}>
        <span>{translation}</span>
        {open && <AddToDeckButton size="sm" word={{ bg: word, en: translation, source: { kind: 'course' } }} />}
      </span>
    </span>
  )
}

// Renders Bulgarian text with meanings on known words.
// Exercise-specific hints (wordMap) take priority over the global VOCAB.
export default function BulgarianSentence({ text, wordMap = {}, className }) {
  const [openIndex, setOpenIndex] = useState(null)
  const tokens = text.split(/(\s+)/)

  return (
    <span className={className} lang="bg">
      {tokens.map((token, i) => {
        if (/^\s+$/.test(token)) return <span key={i}> </span>
        const word = token.replace(/[.,!?;:«»„"'()\-]/g, '')
        const translation = wordMap[word.toLowerCase()] || VOCAB[word.toLowerCase()]
        if (!translation) return <span key={i}>{token}</span>
        return (
          <Word
            key={i}
            token={token}
            word={word}
            translation={translation}
            open={openIndex === i}
            onToggle={isOpen => setOpenIndex(isOpen ? i : null)}
          />
        )
      })}
    </span>
  )
}
