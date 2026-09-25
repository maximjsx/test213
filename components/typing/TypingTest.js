'use client'
import { useEffect, useRef, useState } from 'react'
import { useProgress } from '../../hooks/useProgress'
import { buildText, PHONETIC, KEY_ROWS, LATIN_LABEL, keyFor } from '../../lib/typing'
import { TYPING_DURATIONS, TYPING_SOURCES, typingBoard } from '../../lib/typingBoards'
import Button from '../ui/Button'
import CoinIcon from '../ui/CoinIcon'
import Segmented from './Segmented'
import TypingLeaderboard from './TypingLeaderboard'
import styles from './TypingTest.module.css'

const VISIBLE_WORDS = 36

function Word({ word, typed, state }) {
  if (state !== 'current') return <span className={`${styles.word} ${styles[state] || ''}`}>{word}</span>
  const extra = typed.slice(word.length)
  return (
    <span className={`${styles.word} ${styles.current}`}>
      {[...word].map((ch, i) => (
        <span key={i} className={i < typed.length ? (typed[i] === ch ? styles.charOk : styles.charBad) : i === typed.length ? styles.charNext : ''}>{ch}</span>
      ))}
      {extra && <span className={styles.charBad}>{extra}</span>}
    </span>
  )
}

function Keyboard({ next }) {
  const nextKey = keyFor(next)
  return (
    <div className={styles.keyboard} aria-hidden="true">
      {KEY_ROWS.map((row, r) => (
        <div key={r} className={styles.keyRow} style={{ paddingLeft: `${r * 14}px` }}>
          {row.map(code => (
            <span key={code} className={`${styles.key} ${code === nextKey ? styles.keyNext : ''}`}>
              <span className={styles.keyBg}>{PHONETIC[code]}</span>
              <span className={styles.keyLatin}>{LATIN_LABEL(code)}</span>
            </span>
          ))}
        </div>
      ))}
      <div className={styles.keyRow}>
        <span className={`${styles.key} ${styles.space} ${next === ' ' ? styles.keyNext : ''}`}>space</span>
      </div>
    </div>
  )
}

export default function TypingTest() {
  const { state, completeTyping, beginActivity } = useProgress()
  const [duration, setDuration] = useState(30)
  const [source, setSource] = useState('words')
  const [phonetic, setPhonetic] = useState(true)
  const [run, setRun] = useState(0)
  // Shuffled text is built in the browser only, so server and client render agree
  const [words, setWords] = useState([])
  useEffect(() => { setWords(buildText(source)) }, [source, run])
  const [index, setIndex] = useState(0)
  const [typed, setTyped] = useState('')
  const [results, setResults] = useState([])
  const [keys, setKeys] = useState({ total: 0, correct: 0 })
  const [startedAt, setStartedAt] = useState(null)
  const [now, setNow] = useState(Date.now())
  const [outcome, setOutcome] = useState(null)
  const [boardRefresh, setBoardRefresh] = useState(0)
  const board = typingBoard(duration, source)
  const bestWpm = state.typingBest?.[board] || 0
  const inputRef = useRef(null)
  const tokenRef = useRef(null)

  const reset = () => {
    setIndex(0); setTyped(''); setResults([]); setKeys({ total: 0, correct: 0 })
    setStartedAt(null); setOutcome(null); setRun(r => r + 1)
    setTimeout(() => inputRef.current?.focus(), 0)
  }
  useEffect(reset, [duration, source]) // eslint-disable-line react-hooks/exhaustive-deps

  const elapsed = startedAt ? (now - startedAt) / 1000 : 0
  const remaining = Math.max(0, Math.ceil(duration - elapsed))

  useEffect(() => {
    if (!startedAt || outcome) return
    const id = setInterval(() => setNow(Date.now()), 200)
    return () => clearInterval(id)
  }, [startedAt, outcome])

  useEffect(() => {
    if (!startedAt || outcome || elapsed < duration) return
    const correctWords = results.filter(r => r.ok)
    const correctChars = correctWords.reduce((n, r) => n + r.word.length + 1, 0)
    const summary = {
      duration,
      source,
      wpm: Math.round(correctChars / 5 / (duration / 60)),
      accuracy: keys.total ? Math.round((keys.correct / keys.total) * 100) : 0,
      words: correctWords.length,
    }
    setOutcome({ ...summary, best: summary.wpm > bestWpm, previousBest: bestWpm, coins: null })
    tokenRef.current.then(token => {
      const result = completeTyping(summary, token)
      setOutcome(o => ({ ...o, coins: result.coins || 0 }))
      result.synced?.finally(() => setBoardRefresh(n => n + 1))
    })
  }, [elapsed, startedAt, outcome, duration, source, results, keys, completeTyping, bestWpm])

  const word = words[index] || ''

  function start() {
    if (startedAt) return
    setStartedAt(Date.now())
    setNow(Date.now())
    tokenRef.current = beginActivity('typing', 'typing')
  }

  function commit() {
    if (!typed) return
    setResults(r => [...r, { word, ok: typed === word }])
    setIndex(i => i + 1)
    setTyped('')
  }

  function type(ch) {
    start()
    const ok = word[typed.length] === ch
    setKeys(k => ({ total: k.total + 1, correct: k.correct + (ok ? 1 : 0) }))
    setTyped(t => t + ch)
  }

  function onKeyDown(e) {
    if (outcome) return
    if (e.key === ' ') {
      e.preventDefault()
      commit()
      return
    }
    if (e.ctrlKey || e.metaKey || e.altKey) return
    const mapped = phonetic && PHONETIC[e.code]
    if (mapped) {
      e.preventDefault()
      type(e.shiftKey ? mapped.toUpperCase() : mapped)
    }
  }

  // Typing anywhere on the page goes to the test, without clicking the box first
  const keyDownRef = useRef(onKeyDown)
  keyDownRef.current = onKeyDown
  useEffect(() => {
    function onPageKey(e) {
      const input = inputRef.current
      if (!input || e.target === input || e.ctrlKey || e.metaKey || e.altKey) return
      if (e.key.length !== 1 && e.key !== 'Backspace') return
      if (e.target.closest?.('input, textarea, select, [contenteditable="true"]')) return
      // Focusing during keydown sends the native character (a Bulgarian
      // layout, backspace) into the input; mapped keys are handled here
      input.focus()
      keyDownRef.current(e)
    }
    window.addEventListener('keydown', onPageKey)
    return () => window.removeEventListener('keydown', onPageKey)
  }, [])

  function onChange(e) {
    // Only native typing lands here (a Bulgarian layout, or backspace)
    const value = e.target.value.replace(/\s/g, '')
    if (value.length > typed.length) type(value.slice(typed.length))
    else setTyped(value)
  }

  const first = Math.max(0, index - 6)
  const shown = words.slice(first, first + VISIBLE_WORDS)

  return (
    <div className={styles.test}>
      <div className={styles.toolbar}>
        <Segmented label="Length" options={TYPING_DURATIONS.map(d => ({ id: d, label: `${d}s` }))} value={duration} onChange={setDuration} />
        <Segmented label="Text" options={TYPING_SOURCES} value={source} onChange={setSource} />
        <label className={styles.toggle}>
          <input type="checkbox" checked={phonetic} onChange={e => { setPhonetic(e.target.checked); inputRef.current?.focus() }} />
          Type with a Latin keyboard
        </label>
      </div>

      {outcome ? (
        <section className={styles.result} aria-live="polite">
          <div className={styles.resultStats}>
            <div className={styles.stat}><span className={styles.statValue}>{outcome.wpm}</span><span className={styles.statLabel}>words per minute</span></div>
            <div className={styles.stat}><span className={styles.statValue}>{outcome.accuracy}%</span><span className={styles.statLabel}>accuracy</span></div>
            <div className={styles.stat}><span className={styles.statValue}>{outcome.words}</span><span className={styles.statLabel}>correct words</span></div>
          </div>
          <p className={styles.resultNote}>
            {outcome.best ? 'New personal best.' : `Your best: ${outcome.previousBest} wpm.`}
            {outcome.coins > 0 && <> You earned <CoinIcon size={16} /> {outcome.coins}.</>}
          </p>
          <Button onClick={reset}>Try again</Button>
        </section>
      ) : (
        <section className={styles.board} onClick={() => inputRef.current?.focus()}>
          <div className={styles.status}>
            <span className={styles.timer}>{startedAt ? remaining : duration}</span>
            <span className={styles.hint}>{startedAt ? 'seconds left' : 'Start typing to begin'}</span>
          </div>
          <p className={styles.text} lang="bg">
            {shown.map((w, i) => {
              const at = first + i
              const state = at < index ? (results[at]?.ok ? 'done' : 'missed') : at === index ? 'current' : 'upcoming'
              return <Word key={at} word={w} typed={typed} state={state} />
            })}
          </p>
          <input
            ref={inputRef}
            className={styles.input}
            value={typed}
            onKeyDown={onKeyDown}
            onChange={onChange}
            autoFocus
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            lang="bg"
            aria-label="Type the highlighted word"
          />
        </section>
      )}

      {phonetic && !outcome && <Keyboard next={typed.length >= word.length ? ' ' : word[typed.length]} />}

      <TypingLeaderboard board={board} refreshKey={boardRefresh} />
    </div>
  )
}
