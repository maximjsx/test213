'use client'
import { useState, useRef, useMemo, useEffect } from 'react'
import { shuffle } from '../../lib/checker'
import { playClip, hapticTap } from '../../lib/audio'
import styles from './Exercise.module.css'

// Hear a word and build it from letter tiles, so spelling practice needs no
// Cyrillic keyboard. Extra tiles are the letters most likely to be confused.
export default function SpellWord({ exercise, onAnswer, onPendingChange, checkTrigger, disabled }) {
  const target = exercise.answer.toLowerCase()
  const tiles = useMemo(
    () => shuffle([...target, ...(exercise.extras || []).filter(Boolean).map(l => l.toLowerCase())]).map((letter, id) => ({ id, letter })),
    [exercise.id], // eslint-disable-line react-hooks/exhaustive-deps
  )
  const [picked, setPicked] = useState([])
  const [result, setResult] = useState(null)
  const pickedRef = useRef([])

  const play = () => playClip({ audio: exercise.audio, text: exercise.tts || exercise.answer })

  useEffect(() => {
    play()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function update(next) {
    pickedRef.current = next
    setPicked(next)
    onPendingChange(next.length > 0)
  }

  function pick(tile) {
    if (disabled || result || picked.includes(tile.id)) return
    hapticTap()
    update([...picked, tile.id])
  }

  function unpick(id) {
    if (disabled || result) return
    hapticTap()
    update(picked.filter(p => p !== id))
  }

  useEffect(() => {
    function onKeyDown(e) {
      if (disabled || result) return
      if (e.key === 'Backspace') return update(pickedRef.current.slice(0, -1))
      const free = tiles.find(t => t.letter === e.key.toLowerCase() && !pickedRef.current.includes(t.id))
      if (free) update([...pickedRef.current, free.id])
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [disabled, result, tiles]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (checkTrigger === 0 || result || !pickedRef.current.length) return
    const spelled = pickedRef.current.map(id => tiles[id].letter).join('')
    const ok = spelled === target
    setResult(ok ? 'ok' : 'bad')
    onAnswer(ok, ok ? '' : `Correct spelling: "${exercise.answer}"`)
  }, [checkTrigger]) // eslint-disable-line react-hooks/exhaustive-deps

  const letterOf = (id, index) => {
    const letter = tiles[id].letter
    return index === 0 && exercise.answer[0] !== target[0] ? letter.toUpperCase() : letter
  }

  return (
    <div className={styles.wrap}>
      <p className={styles.label}>SPELL WHAT YOU HEAR</p>

      <div className={styles.spellHead}>
        <button className={styles.ttsInline} onClick={play} title="Listen again">
          <img src="/icons/speaker.png" alt="Listen again" width={20} height={20} />
        </button>
        {exercise.prompt && <h2 className={styles.question}>{exercise.prompt}</h2>}
      </div>

      <div className={`${styles.spellSlots} ${result === 'ok' ? styles.spellOk : result === 'bad' ? styles.spellBad : ''}`} lang="bg">
        {picked.length === 0 && <span className={styles.answerPlaceholder}>Tap the letters in order</span>}
        {picked.map((id, i) => (
          <button key={id} className={`${styles.spellLetter} ${styles.wordChipNew}`} onClick={() => unpick(id)} disabled={disabled || !!result}>
            {letterOf(id, i)}
          </button>
        ))}
      </div>

      <div className={styles.spellBank} lang="bg">
        {tiles.map(tile => (
          <button
            key={tile.id}
            className={styles.spellTile}
            onClick={() => pick(tile)}
            disabled={disabled || !!result || picked.includes(tile.id)}
          >
            {tile.letter}
          </button>
        ))}
      </div>
    </div>
  )
}
