'use client'
import { useState, useMemo } from 'react'
import { shuffle } from '../../lib/checker'
import { speakText, hapticTap, hapticWrong } from '../../lib/audio'
import styles from './Exercise.module.css'

// Connect each picture (left) to its Bulgarian word (right).
export default function ImageMatch({ exercise, onAnswer, disabled }) {
  const pairs = exercise.pairs || []
  const leftItems  = useMemo(() => shuffle(pairs.map((p, i) => ({ id: i, image: p.image }))), [exercise.id])
  const rightItems = useMemo(() => shuffle(pairs.map((p, i) => ({ id: i, word: p.word }))), [exercise.id])

  const [selLeftId, setSelLeftId] = useState(null)
  const [selRightId, setSelRightId] = useState(null)
  const [matchedPairs, setMatchedPairs] = useState([])
  const [wrongLeft, setWrongLeft] = useState(null)
  const [wrongRight, setWrongRight] = useState(null)

  const totalPairs = pairs.length

  function isLeftMatched(id)  { return matchedPairs.some(p => p.leftId === id) }
  function isRightMatched(id) { return matchedPairs.some(p => p.rightId === id) }

  function tryMatch(leftId, rightId) {
    if (pairs[leftId].word === pairs[rightId].word) {
      hapticTap()
      const next = [...matchedPairs, { leftId, rightId }]
      setMatchedPairs(next)
      setSelLeftId(null)
      setSelRightId(null)
      if (next.length === totalPairs) onAnswer(true)
    } else {
      hapticWrong()
      setWrongLeft(leftId)
      setWrongRight(rightId)
      setTimeout(() => {
        setWrongLeft(null); setWrongRight(null); setSelLeftId(null); setSelRightId(null)
      }, 700)
    }
  }

  function pickLeft(item) {
    if (disabled || isLeftMatched(item.id)) return
    hapticTap()
    if (selRightId !== null) { tryMatch(item.id, selRightId); return }
    setSelLeftId(selLeftId === item.id ? null : item.id)
  }

  function pickRight(item) {
    if (disabled || isRightMatched(item.id)) return
    hapticTap()
    speakText(item.word)
    if (selLeftId !== null) { tryMatch(selLeftId, item.id); return }
    setSelRightId(selRightId === item.id ? null : item.id)
  }

  return (
    <div className={styles.wrap}>
      <p className={styles.label}>MATCH THE PAIRS</p>
      {exercise.instruction && <h2 className={styles.question}>{exercise.instruction}</h2>}

      <div className={styles.matchGrid}>
        <div className={styles.matchCol}>
          {leftItems.map(item => (
            <button
              key={item.id}
              className={`${styles.imageMatchChip}
                ${isLeftMatched(item.id) ? styles.chipMatched
                  : selLeftId === item.id ? styles.chipSel
                  : wrongLeft === item.id ? styles.chipWrong : ''}`}
              onClick={() => pickLeft(item)}
              disabled={isLeftMatched(item.id) || disabled}
            >
              {item.image?.url
                ? <img src={item.image.url} alt="" />
                : <span className={styles.imagePlaceholder}>?</span>}
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
              {item.word}
            </button>
          ))}
        </div>
      </div>
      <p className={styles.matchHint}>{matchedPairs.length} / {totalPairs} matched</p>
    </div>
  )
}
