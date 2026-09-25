'use client'
import { useState } from 'react'
import { markDictation } from '../../lib/dictation'
import Button from '../ui/Button'
import styles from './MediaPlayer.module.css'

// Listen to one line, type what you hear, then see which words you caught
export default function Dictation({ lines, index, onIndex, onPlayLine }) {
  const [typed, setTyped] = useState('')
  const [marks, setMarks] = useState(null)
  const line = lines[index]

  const go = i => {
    setTyped('')
    setMarks(null)
    onIndex(i)
    onPlayLine(i)
  }

  function check(e) {
    e.preventDefault()
    if (!typed.trim()) return
    setMarks(markDictation(line.bg, typed))
  }

  const caught = marks?.filter(m => m.ok).length

  return (
    <div className={styles.dictation}>
      <div className={styles.dictationTop}>
        <span className={styles.dictationCount}>Line {index + 1} of {lines.length}</span>
        <Button variant="secondary" size="sm" onClick={() => onPlayLine(index)}>Play line</Button>
      </div>

      {marks ? (
        <>
          <p className={styles.dictationResult} lang="bg">
            {marks.map((m, i) => (
              <span key={i} className={m.ok ? styles.heard : styles.notHeard}>{m.word} </span>
            ))}
          </p>
          {line.en && <p className={styles.nowEn}>{line.en}</p>}
          <p className={styles.dictationScore}>You caught {caught} of {marks.length} words.</p>
          <div className={styles.dictationActions}>
            <Button variant="secondary" size="sm" onClick={() => setMarks(null)}>Try again</Button>
            <Button size="sm" onClick={() => go(index + 1)} disabled={index >= lines.length - 1}>Next line</Button>
          </div>
        </>
      ) : (
        <form className={styles.dictationForm} onSubmit={check}>
          <input
            className={styles.dictationInput}
            value={typed}
            onChange={e => setTyped(e.target.value)}
            placeholder="Type what you hear"
            aria-label="Type what you hear"
            lang="bg"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
          />
          <Button type="submit" size="sm" disabled={!typed.trim()}>Check</Button>
        </form>
      )}
    </div>
  )
}
