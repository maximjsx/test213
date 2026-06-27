'use client'
import { useState, useRef, useMemo, useEffect } from 'react'
import { shuffle, checkAnswer } from '../../lib/checker'
import { speakBulgarian, speakText, hapticTap } from '../../lib/audio'
import BulgarianSentence, { parseWordHints } from './BulgarianSentence'
import styles from './Exercise.module.css'

export default function WordBank({ exercise, onAnswer, onPendingChange, checkTrigger, disabled, useKeyboard }) {
  const initialBank = useMemo(
    () => shuffle(exercise.words).map((word, i) => ({ id: i, word })),
    [exercise.id]
  )
  const [answerWords, setAnswerWords] = useState([])
  const [bankItems, setBankItems] = useState(initialBank)
  const [textValue, setTextValue] = useState('')
  const [dragOverZone, setDragOverZone] = useState(null)
  const answerRef = useRef([])
  const textRef = useRef('')
  const checkedRef = useRef(false)
  const dragItem = useRef(null)

  useEffect(() => { answerRef.current = answerWords }, [answerWords])
  useEffect(() => { textRef.current = textValue }, [textValue])

  useEffect(() => { if (exercise.tts && /[Ѐ-ӿ]/.test(exercise.tts)) speakBulgarian(exercise.tts) }, []) // eslint-disable-line

  // Re-report pending state when keyboard mode toggles
  useEffect(() => {
    if (checkedRef.current) return
    onPendingChange(useKeyboard ? textRef.current.trim().length > 0 : answerRef.current.length > 0)
  }, [useKeyboard]) // eslint-disable-line

  function addWord(item) {
    if (disabled || checkedRef.current) return
    hapticTap()
    speakText(item.word)
    const newAnswer = [...answerWords, item]
    setAnswerWords(newAnswer)
    setBankItems(prev => prev.filter(w => w.id !== item.id))
    onPendingChange(true)
  }

  function removeWord(item) {
    if (disabled || checkedRef.current) return
    hapticTap()
    speakText(item.word)
    const newAnswer = answerWords.filter(w => w.id !== item.id)
    setAnswerWords(newAnswer)
    setBankItems(prev => [...prev, item].sort((a, b) => a.id - b.id))
    onPendingChange(newAnswer.length > 0)
  }

  function onDragStartBank(e, item) {
    dragItem.current = { item, from: 'bank' }
    e.dataTransfer.effectAllowed = 'move'
  }

  function onDragStartAnswer(e, item) {
    dragItem.current = { item, from: 'answer' }
    e.dataTransfer.effectAllowed = 'move'
  }

  function onDropAnswer(e) {
    e.preventDefault()
    setDragOverZone(null)
    const d = dragItem.current
    if (!d || disabled || checkedRef.current) return
    if (d.from === 'bank') addWord(d.item)
    dragItem.current = null
  }

  function onDropBank(e) {
    e.preventDefault()
    setDragOverZone(null)
    const d = dragItem.current
    if (!d || disabled || checkedRef.current) return
    if (d.from === 'answer') removeWord(d.item)
    dragItem.current = null
  }

  function handleTextChange(e) {
    setTextValue(e.target.value)
    textRef.current = e.target.value
    onPendingChange(e.target.value.trim().length > 0)
  }

  useEffect(() => {
    if (checkTrigger === 0 || checkedRef.current) return
    checkedRef.current = true
    const userInput = useKeyboard
      ? textRef.current
      : answerRef.current.map(w => w.word).join(' ')
    const isToBg = exercise.direction === 'to_bg'
    const result = checkAnswer(userInput, exercise.answer, {
      allowTranslit: isToBg,
      translitMap: exercise.translitMap || {},
    })
    if (result.correct) onAnswer(true)
    else if (result.close && useKeyboard) onAnswer(false, result.message)
    else onAnswer(false, `Correct: "${exercise.answer}"`)
  }, [checkTrigger]) // eslint-disable-line

  const isToBg = exercise.direction === 'to_bg'

  return (
    <div className={styles.wrap}>
      <p className={styles.label}>{isToBg ? 'WRITE THIS IN BULGARIAN' : 'WRITE THIS IN ENGLISH'}</p>
      <div className={styles.promptRow}>
        <h2 className={styles.question}>
          {/[Ѐ-ӿ]/.test(exercise.prompt)
            ? <BulgarianSentence text={exercise.prompt} wordMap={parseWordHints(exercise.hint)} />
            : exercise.prompt}
        </h2>
        {exercise.tts && /[Ѐ-ӿ]/.test(exercise.tts) && (
          <button className={styles.ttsInline} onClick={() => speakBulgarian(exercise.tts)} title="Listen">
            <img src="/icons/speaker.png" alt="🔊" width={20} height={20} />
          </button>
        )}
      </div>
      {exercise.hint && /[Ѐ-ӿ]/.test(exercise.prompt) && !exercise.hint.includes(' = ') && <p className={styles.hint}>💡 {exercise.hint}</p>}

      {useKeyboard ? (
        <div className={styles.inputRow}>
          <input
            className={styles.input}
            type="text"
            value={textValue}
            onChange={handleTextChange}
            placeholder={isToBg ? 'Type in Bulgarian…' : 'Type your translation…'}
            disabled={disabled}
            autoFocus
            autoComplete="off"
            spellCheck="false"
          />
        </div>
      ) : (
        <>
          <div
            className={`${styles.answerZone} ${dragOverZone === 'answer' ? styles.answerZoneDragOver : ''}`}
            onDragOver={e => { e.preventDefault(); setDragOverZone('answer') }}
            onDragLeave={() => setDragOverZone(null)}
            onDrop={onDropAnswer}
          >
            {answerWords.length === 0
              ? <span className={styles.answerPlaceholder}>Tap words below to build your answer</span>
              : answerWords.map(item => (
                  <button
                    key={item.id}
                    className={styles.wordChip}
                    draggable={!disabled}
                    onDragStart={e => onDragStartAnswer(e, item)}
                    onClick={() => removeWord(item)}
                    disabled={disabled}
                  >
                    {item.word}
                  </button>
                ))
            }
          </div>

          <div
            className={`${styles.wordBank} ${dragOverZone === 'bank' ? styles.wordBankDragOver : ''}`}
            onDragOver={e => { e.preventDefault(); setDragOverZone('bank') }}
            onDragLeave={() => setDragOverZone(null)}
            onDrop={onDropBank}
          >
            {bankItems.map(item => (
              <button
                key={item.id}
                className={styles.wordTile}
                draggable={!disabled}
                onDragStart={e => onDragStartBank(e, item)}
                onClick={() => addWord(item)}
                disabled={disabled}
              >
                {item.word}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
