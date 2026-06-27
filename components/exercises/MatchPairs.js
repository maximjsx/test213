'use client'
import { useState, useMemo } from 'react'
import { shuffle } from '../../lib/checker'
import { speakText } from '../../lib/audio'
import styles from './Exercise.module.css'

export default function MatchPairs({ exercise, onAnswer, disabled }) {
  const leftItems  = useMemo(() => shuffle(exercise.pairs.map((p, i) => ({ id: i, val: p.left  }))), [exercise.id])
  const rightItems = useMemo(() => shuffle(exercise.pairs.map((p, i) => ({ id: i, val: p.right }))), [exercise.id])

  const [selLeftId,  setSelLeftId]  = useState(null)
  const [selRightId, setSelRightId] = useState(null)
  // Track matched pairs as [{leftId, rightId}] so left and right id-spaces don't collide
  const [matchedPairs, setMatchedPairs] = useState([])
  // Track wrong flash separately per column so duplicate values don't bleed across
  const [wrongLeft,  setWrongLeft]  = useState(null)
  const [wrongRight, setWrongRight] = useState(null)

  const totalPairs = exercise.pairs.length

  function isLeftMatched(id)  { return matchedPairs.some(p => p.leftId  === id) }
  function isRightMatched(id) { return matchedPairs.some(p => p.rightId === id) }

  function tryMatch(leftId, rightId) {
    // Correct when the left item's expected right value equals the selected right item's value
    const expectedRight = exercise.pairs[leftId].right
    const selectedRight = exercise.pairs[rightId].right
    if (expectedRight === selectedRight) {
      const next = [...matchedPairs, { leftId, rightId }]
      setMatchedPairs(next)
      setSelLeftId(null)
      setSelRightId(null)
      if (next.length === totalPairs) onAnswer(true)
    } else {
      setWrongLeft(leftId)
      setWrongRight(rightId)
      setTimeout(() => {
        setWrongLeft(null)
        setWrongRight(null)
        setSelLeftId(null)
        setSelRightId(null)
      }, 700)
    }
  }

  function pickLeft(item) {
    if (disabled || isLeftMatched(item.id)) return
    speakText(item.val)
    if (selRightId !== null) { tryMatch(item.id, selRightId); return }
    setSelLeftId(selLeftId === item.id ? null : item.id)
  }

  function pickRight(item) {
    if (disabled || isRightMatched(item.id)) return
    speakText(item.val)
    if (selLeftId !== null) { tryMatch(selLeftId, item.id); return }
    setSelRightId(selRightId === item.id ? null : item.id)
  }

  return (
    <div className={styles.wrap}>
      <p className={styles.label}>MATCH THE PAIRS</p>
      <h2 className={styles.question}>{exercise.instruction}</h2>

      <div className={styles.matchGrid}>
        <div className={styles.matchCol}>
          {leftItems.map(item => (
            <button
              key={item.id}
              className={`${styles.matchChip}
                ${isLeftMatched(item.id) ? styles.chipMatched
                  : selLeftId === item.id ? styles.chipSel
                  : wrongLeft === item.id ? styles.chipWrong : ''}`}
              onClick={() => pickLeft(item)}
              disabled={isLeftMatched(item.id) || disabled}
            >
              {item.val}
            </button>
          ))}
        </div>
        <div className={styles.matchCol}>
          {rightItems.map(item => (
            <button
              key={item.id}
              className={`${styles.matchChip}
                ${isRightMatched(item.id) ? styles.chipMatched
                  : selRightId === item.id ? styles.chipSel
                  : wrongRight === item.id ? styles.chipWrong : ''}`}
              onClick={() => pickRight(item)}
              disabled={isRightMatched(item.id) || disabled}
            >
              {item.val}
            </button>
          ))}
        </div>
      </div>
      <p className={styles.matchHint}>{matchedPairs.length} / {totalPairs} matched</p>
    </div>
  )
}
