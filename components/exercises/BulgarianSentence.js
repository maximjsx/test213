'use client'
import styles from './BulgarianSentence.module.css'
import { VOCAB } from '../../lib/vocab'

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

// Renders Bulgarian text with hover tooltips on known words.
// Exercise-specific hints (wordMap) take priority over the global VOCAB.
export default function BulgarianSentence({ text, wordMap = {}, className }) {
  const tokens = text.split(/(\s+)/)

  return (
    <span className={className}>
      {tokens.map((token, i) => {
        if (/^\s+$/.test(token)) return <span key={i}> </span>
        const clean = token.replace(/[.,!?;:«»„"'()\-]/g, '').toLowerCase()
        const translation = wordMap[clean] || VOCAB[clean]

        if (!translation) return <span key={i}>{token}</span>

        return (
          <span key={i} className={styles.wordWrap}>
            <span className={styles.word}>{token}</span>
            <span className={styles.tooltip}>{translation}</span>
          </span>
        )
      })}
    </span>
  )
}
