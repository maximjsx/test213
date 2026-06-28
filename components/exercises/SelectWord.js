'use client'
import { useState, useRef, useMemo, useEffect } from 'react'
import { shuffle } from '../../lib/checker'
import { speakText, hapticTap } from '../../lib/audio'
import BulgarianSentence, { parseWordHints } from './BulgarianSentence'
import styles from './Exercise.module.css'

export default function SelectWord({ exercise, onAnswer, onPendingChange, checkTrigger, disabled }) {
  const [selected, setSelected] = useState(null)
  const [checked, setChecked] = useState(false)
  const selectedRef = useRef(null)
  const checkedRef = useRef(false)
  const choices = useMemo(() => shuffle(exercise.choices), [exercise.id])
  const [before, after] = exercise.sentence.split('___')
  const isBg = /[Ѐ-ӿ]/.test(exercise.sentence)

  function select(choice) {
    if (disabled || checkedRef.current) return
    hapticTap()
    if (/[Ѐ-ӿ]/.test(choice)) speakText(choice)
    setSelected(choice)
    selectedRef.current = choice
    onPendingChange(true)
  }

  useEffect(() => {
    if (checkTrigger === 0 || !selectedRef.current || checkedRef.current) return
    checkedRef.current = true
    setChecked(true)
    const correct = selectedRef.current.trim().toLowerCase() === exercise.answer.trim().toLowerCase()
    if (correct) onAnswer(true)
    else onAnswer(false, `Correct: "${exercise.answer}"`)
  }, [checkTrigger]) // eslint-disable-line

  const tileClass = (c) => {
    if (!selected) return styles.wordTile
    if (!checked) return `${styles.wordTile} ${selected === c ? styles.selected : ''}`
    if (c === exercise.answer) return `${styles.wordTile} ${styles.correct}`
    if (c === selected) return `${styles.wordTile} ${styles.wrong}`
    return styles.wordTile
  }

  const blankClass = !checked
    ? selected ? `${styles.selectBlank} ${styles.selectBlankFilled}` : styles.selectBlank
    : selected === exercise.answer
      ? `${styles.selectBlank} ${styles.selectBlankCorrect}`
      : `${styles.selectBlank} ${styles.selectBlankWrong}`

  return (
    <div className={styles.wrap}>
      <p className={styles.label}>SELECT THE MISSING WORD</p>
      {exercise.prompt && (
        <div className={styles.promptRow}>
          <h2 className={styles.question}>
            {/[Ѐ-ӿ]/.test(exercise.prompt)
              ? <BulgarianSentence text={exercise.prompt} wordMap={parseWordHints(exercise.hint)} />
              : exercise.prompt}
          </h2>
        </div>
      )}
      <div className={styles.sentenceWrap}>
        {isBg
          ? <BulgarianSentence text={before} wordMap={parseWordHints(exercise.hint)} />
          : <span>{before}</span>}
        <span className={blankClass}>{selected || '______'}</span>
        {isBg
          ? <BulgarianSentence text={after} wordMap={parseWordHints(exercise.hint)} />
          : <span>{after}</span>}
      </div>
      <div className={styles.wordBank} style={{ borderTop: 'none', marginTop: 24, paddingTop: 0 }}>
        {choices.map(c => (
          <button
            key={c}
            className={tileClass(c)}
            onClick={() => select(c)}
            disabled={disabled || checked}
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  )
}
