'use client'
import { useEffect, useRef, useState } from 'react'
import { useProgress } from '../../hooks/useProgress'
import { buildText, LAYOUTS, LATIN_LABEL, keyFor } from '../../lib/typing'
import { TYPING_DURATIONS, TYPING_SOURCES, typingBoard } from '../../lib/typingBoards'
import Button from '../ui/Button'
import CoinIcon from '../ui/CoinIcon'
import AddToDeckButton from '../decks/AddToDeckButton'
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

const TEXT_OPTIONS = [...TYPING_SOURCES, { id: 'letters', label: 'Letters' }]
const KEYBOARD_OPTIONS = [
  { id: 'phonetic', label: 'Phonetic' },
  { id: 'bds', label: 'BDS' },
  { id: 'native', label: 'My own' },
]
const LAYOUT_KEY = 'typingLayout'

function savedLayout() {
  try {
    const value = localStorage.getItem(LAYOUT_KEY)
    return KEYBOARD_OPTIONS.some(o => o.id === value) ? value : null
  } catch {
    return null
  }
}

// Words typed wrong, without the punctuation of sentence mode, ready to save to a deck
function missedWords(results) {
  const words = results.filter(r => !r.ok).map(r => r.word.replace(/[^\p{L}-]/gu, '')).filter(Boolean)
  return [...new Set(words)].slice(0, 12)
}

function Keyboard({ layout, next }) {
  const { keys, rows } = LAYOUTS[layout]
  const nextKey = keyFor(layout, next)
  return (
    <div className={styles.keyboard} style={{ '--cols': Math.max(...rows.map(r => r.length)) }} aria-hidden="true">
      {rows.map((row, r) => (
        <div key={r} className={styles.keyRow} style={{ paddingLeft: `${r * 14}px` }}>
          {row.map(code => (
            <span key={code} className={`${styles.key} ${code === nextKey ? styles.keyNext : ''}`}>
              <span className={styles.keyBg}>{keys[code]}</span>
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
  const [layout, setLayout] = useState('phonetic')
  useEffect(() => { setLayout(l => savedLayout() || l) }, [])
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
  const warmUp = source === 'letters'
  const board = typingBoard(duration, source)
  const bestWpm = warmUp ? 0 : state.typingBest?.[board] || 0
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
    const missed = warmUp ? [] : missedWords(results)
    if (warmUp) {
      setOutcome({ ...summary, missed, coins: 0 })
      return
    }
    setOutcome({ ...summary, missed, best: summary.wpm > bestWpm, previousBest: bestWpm, coins: null })
    tokenRef.current.then(token => {
      const result = completeTyping(summary, token)
      setOutcome(o => ({ ...o, coins: result.coins || 0 }))
      result.synced?.finally(() => setBoardRefresh(n => n + 1))
    })
  }, [elapsed, startedAt, outcome, duration, source, warmUp, results, keys, completeTyping, bestWpm])

  const word = words[index] || ''

  function start() {
    if (startedAt) return
    setStartedAt(Date.now())
    setNow(Date.now())
    if (!warmUp) tokenRef.current = beginActivity('typing', 'typing')
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
    const mapped = LAYOUTS[layout]?.keys[e.code]
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

  function chooseLayout(id) {
    setLayout(id)
    try { localStorage.setItem(LAYOUT_KEY, id) } catch {}
    inputRef.current?.focus()
  }

  const first = Math.max(0, index - 6)
  const shown = words.slice(first, first + VISIBLE_WORDS)

  return (
    <div className={styles.test}>
      <div className={styles.toolbar}>
        <Segmented label="Length" options={TYPING_DURATIONS.map(d => ({ id: d, label: `${d}s` }))} value={duration} onChange={setDuration} />
        <Segmented label="Text" options={TEXT_OPTIONS} value={source} onChange={setSource} />
        <Segmented label="Keyboard layout" options={KEYBOARD_OPTIONS} value={layout} onChange={chooseLayout} />
      </div>

      {outcome ? (
        <section className={styles.result} aria-live="polite">
          <div className={styles.resultStats}>
            <div className={styles.stat}><span className={styles.statValue}>{outcome.wpm}</span><span className={styles.statLabel}>words per minute</span></div>
            <div className={styles.stat}><span className={styles.statValue}>{outcome.accuracy}%</span><span className={styles.statLabel}>accuracy</span></div>
            <div className={styles.stat}><span className={styles.statValue}>{outcome.words}</span><span className={styles.statLabel}>correct words</span></div>
          </div>
          <p className={styles.resultNote}>
            {warmUp
              ? 'Warm-up runs are not ranked.'
              : outcome.best ? 'New personal best.' : `Your best: ${outcome.previousBest} wpm.`}
            {outcome.coins > 0 && <> You earned <CoinIcon size={16} /> {outcome.coins}.</>}
          </p>
          {outcome.missed.length > 0 && (
            <div className={styles.missedBox}>
              <h2 className={styles.missedTitle}>Words you missed</h2>
              <ul className={styles.missedList}>
                {outcome.missed.map(w => (
                  <li key={w} className={styles.missedWord}>
                    <span lang="bg">{w}</span>
                    <AddToDeckButton size="sm" word={{ bg: w, source: { kind: 'custom', ref: 'typing' } }} />
                  </li>
                ))}
              </ul>
            </div>
          )}
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

      {layout !== 'native' && !outcome && <Keyboard layout={layout} next={typed.length >= word.length ? ' ' : word[typed.length]} />}

      {warmUp
        ? <p className={styles.warmUpNote}>Letters is a warm-up for learning where the keys are. It has no leaderboard and earns no coins.</p>
        : <TypingLeaderboard board={board} refreshKey={boardRefresh} />}
    </div>
  )
}
