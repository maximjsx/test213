'use client'
import { useState, useRef, useMemo, useEffect } from 'react'
import { flushSync } from 'react-dom'
import { shuffle, checkAnswer } from '../../lib/checker'
import { speakBulgarian, speakText, hapticTap } from '../../lib/audio'
import BulgarianSentence, { parseWordHints } from './BulgarianSentence'
import styles from './Exercise.module.css'

function FlyingWord({ word, fromX, fromY, toX, toY, width, height, chipStyle }) {
  const ref = useRef(null)
  const dx = toX - fromX
  const dy = toY - fromY

  useEffect(() => {
    const outer = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (ref.current) ref.current.style.transform = `translate(${dx}px, ${dy}px)`
      })
    })
    return () => cancelAnimationFrame(outer)
  }, []) // eslint-disable-line

  return (
    <div
      ref={ref}
      className={chipStyle ? styles.wordChip : styles.wordTile}
      style={{
        position: 'fixed',
        left: fromX, top: fromY,
        width, height,
        transform: 'none',
        transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
        zIndex: 9999,
        pointerEvents: 'none',
        margin: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {word}
    </div>
  )
}

export default function WordBank({ exercise, onAnswer, onPendingChange, checkTrigger, disabled, useKeyboard }) {
  const initialBank = useMemo(
    () => shuffle(exercise.words).map((word, i) => ({ id: i, word })),
    [exercise.id]
  )
  const [answerWords, setAnswerWords] = useState([])
  const [bankItems, setBankItems] = useState(initialBank)
  const [textValue, setTextValue] = useState('')
  const [dragOverZone, setDragOverZone] = useState(null)
  const [flyingItems, setFlyingItems] = useState([])
  // Items hidden during flight (visibility:hidden keeps layout stable)
  const [hiddenItems, setHiddenItems] = useState(new Set())
  // Tiles that have been moved to answer — stay in bank DOM as invisible placeholders so layout doesn't shift
  const [placeholderItems, setPlaceholderItems] = useState(new Set())
  const [popItems, setPopItems] = useState(new Set())

  const answerRef = useRef([])
  const textRef = useRef('')
  const checkedRef = useRef(false)
  const dragItem = useRef(null)
  const chipRefs = useRef(new Map())
  const tileRefs = useRef(new Map())

  useEffect(() => { answerRef.current = answerWords }, [answerWords])
  useEffect(() => { textRef.current = textValue }, [textValue])

  useEffect(() => { if (exercise.tts && /[Ѐ-ӿ]/.test(exercise.tts)) speakBulgarian(exercise.tts) }, []) // eslint-disable-line

  // Re-report pending state when keyboard mode toggles
  useEffect(() => {
    if (checkedRef.current) return
    onPendingChange(useKeyboard ? textRef.current.trim().length > 0 : answerRef.current.length > 0)
  }, [useKeyboard]) // eslint-disable-line

  function triggerPop(itemId) {
    setPopItems(prev => { const s = new Set(prev); s.add(itemId); return s })
    setTimeout(() => setPopItems(prev => { const s = new Set(prev); s.delete(itemId); return s }), 400)
  }

  function launchFly({ word, srcRect, dstRect, chipStyle }) {
    // Align clone center-to-center with the destination element
    const toX = dstRect.left + (dstRect.width - srcRect.width) / 2
    const toY = dstRect.top + (dstRect.height - srcRect.height) / 2
    const flyId = `fly-${Date.now()}-${Math.random()}`
    setFlyingItems(prev => [...prev, {
      flyId, word, chipStyle,
      fromX: srcRect.left, fromY: srcRect.top,
      toX, toY,
      width: srcRect.width, height: srcRect.height,
    }])
    setTimeout(() => setFlyingItems(prev => prev.filter(f => f.flyId !== flyId)), 340)
  }

  function addWord(item, sourceEl) {
    if (disabled || checkedRef.current) return
    hapticTap()
    speakText(item.word)
    onPendingChange(true)

    if (sourceEl) {
      const srcRect = sourceEl.getBoundingClientRect()

      // Add chip hidden + keep tile hidden in bank → neither zone reflowed
      flushSync(() => {
        setAnswerWords(prev => [...prev, item])
        setHiddenItems(prev => new Set([...prev, item.id]))
      })

      // Chip is now in the DOM at its real position — measure it
      const dstRect = chipRefs.current.get(item.id)?.getBoundingClientRect()
      if (dstRect) launchFly({ word: item.word, srcRect, dstRect, chipStyle: false })

      // After clone lands: mark tile as placeholder (keeps layout), reveal chip
      setTimeout(() => {
        setPlaceholderItems(prev => new Set([...prev, item.id]))
        setHiddenItems(prev => { const s = new Set(prev); s.delete(item.id); return s })
        triggerPop(item.id)
      }, 260)
    } else {
      setPlaceholderItems(prev => new Set([...prev, item.id]))
      setAnswerWords(prev => [...prev, item])
      triggerPop(item.id)
    }
  }

  function removeWord(item, sourceEl) {
    if (disabled || checkedRef.current) return
    hapticTap()
    speakText(item.word)
    onPendingChange(answerWords.filter(w => w.id !== item.id).length > 0)

    if (sourceEl) {
      const srcRect = sourceEl.getBoundingClientRect()

      // Tile is already in the bank DOM as a placeholder — unhide it (via hiddenItems) so we can measure it
      flushSync(() => {
        setPlaceholderItems(prev => { const s = new Set(prev); s.delete(item.id); return s })
        setHiddenItems(prev => new Set([...prev, item.id]))
      })

      // Tile is now in the DOM at its real position — measure it
      const dstRect = tileRefs.current.get(item.id)?.getBoundingClientRect()
      if (dstRect) launchFly({ word: item.word, srcRect, dstRect, chipStyle: true })

      // After clone lands: remove chip from answer, reveal tile
      setTimeout(() => {
        setAnswerWords(prev => prev.filter(w => w.id !== item.id))
        setHiddenItems(prev => { const s = new Set(prev); s.delete(item.id); return s })
        triggerPop(item.id)
      }, 260)
    } else {
      setAnswerWords(prev => prev.filter(w => w.id !== item.id))
      setPlaceholderItems(prev => { const s = new Set(prev); s.delete(item.id); return s })
      triggerPop(item.id)
    }
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
    const answerField = exercise.answers ?? exercise.answer
    const result = checkAnswer(userInput, answerField, {
      allowTranslit: isToBg,
      translitMap: exercise.translitMap || {},
    })
    if (result.correct) onAnswer(true)
    else if (result.close && useKeyboard) onAnswer(false, result.message)
    else {
      const shown = Array.isArray(answerField) ? answerField[0] : answerField
      onAnswer(false, `Correct: "${shown}"`)
    }
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
                    ref={el => { if (el) chipRefs.current.set(item.id, el); else chipRefs.current.delete(item.id) }}
                    className={`${styles.wordChip} ${popItems.has(item.id) ? styles.wordChipNew : ''}`}
                    style={hiddenItems.has(item.id) ? { visibility: 'hidden' } : undefined}
                    draggable={!disabled}
                    onDragStart={e => onDragStartAnswer(e, item)}
                    onClick={e => removeWord(item, e.currentTarget)}
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
            {bankItems.map(item => {
              const isPlaceholder = placeholderItems.has(item.id)
              const isHidden = hiddenItems.has(item.id)
              return (
                <button
                  key={item.id}
                  ref={el => { if (el) tileRefs.current.set(item.id, el); else tileRefs.current.delete(item.id) }}
                  className={`${styles.wordTile} ${popItems.has(item.id) ? styles.wordTileNew : ''}`}
                  style={(isHidden || isPlaceholder) ? { visibility: 'hidden', pointerEvents: 'none' } : undefined}
                  draggable={!disabled && !isPlaceholder}
                  onDragStart={e => onDragStartBank(e, item)}
                  onClick={e => addWord(item, e.currentTarget)}
                  disabled={disabled || isPlaceholder}
                >
                  {item.word}
                </button>
              )
            })}
          </div>

          {flyingItems.map(f => (
            <FlyingWord key={f.flyId} {...f} />
          ))}
        </>
      )}
    </div>
  )
}
