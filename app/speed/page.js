'use client'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useProgress } from '../../hooks/useProgress'
import { LETTERS, WORDS, MIN_SPEED_ITEMS, withStrength } from '../../lib/words'
import { playCorrect, playWrong, unlockAudio } from '../../lib/audio'
import { shuffle } from '../../lib/checker'
import Bear from '../../components/Bear'
import Chevron from '../../components/Chevron'
import LoadingBear from '../../components/LoadingBear'
import styles from '../../components/Practice.module.css'

const ROUND_MS = 60000
const ROWS = 5
const MAX_XP = 25

const MODES = {
  words: {
    title: 'Word speed round',
    back: '/words',
    learnHref: '/',
    pool: lessons => withStrength(WORDS, lessons).filter(w => w.strength > 0).map(w => ({ left: w.bg, right: w.en })),
  },
  letters: {
    title: 'Letter speed round',
    back: '/letters',
    learnHref: '/topic/alphabet',
    pool: lessons => withStrength(LETTERS, lessons).filter(l => l.strength > 0).map(l => ({ left: `${l.letter}${l.letter.toLowerCase()}`, right: l.sound })),
  },
}

const emptyBoard = () => ({ left: Array(ROWS).fill(null), right: Array(ROWS).fill(null) })

// Refills empty rows two or more at a time, so a new pair never lands as the
// only obvious match. Items already on the board (by text) are skipped.
function refill(board, pool, justMatched) {
  const emptyLeft = board.left.map((v, i) => (v === null ? i : -1)).filter(i => i >= 0)
  if (emptyLeft.length < 2 && emptyLeft.length < ROWS) return board
  const emptyRight = board.right.map((v, i) => (v === null ? i : -1)).filter(i => i >= 0)

  const onBoard = board.left.filter(v => v !== null)
  const usedLeft = new Set(onBoard.map(i => pool[i].left))
  const usedRight = new Set(onBoard.map(i => pool[i].right))
  const fresh = shuffle(pool.map((_, i) => i).filter(i => !justMatched.includes(i)))
  const fallback = shuffle(justMatched)

  const picks = []
  for (const i of [...fresh, ...fallback]) {
    if (picks.length === emptyLeft.length) break
    if (usedLeft.has(pool[i].left) || usedRight.has(pool[i].right)) continue
    usedLeft.add(pool[i].left)
    usedRight.add(pool[i].right)
    picks.push(i)
  }

  const next = { left: [...board.left], right: [...board.right] }
  shuffle(emptyLeft).slice(0, picks.length).forEach((slot, k) => { next.left[slot] = picks[k] })
  shuffle(emptyRight).slice(0, picks.length).forEach((slot, k) => { next.right[slot] = picks[k] })
  return next
}

function Tile({ text, state, lang, onClick }) {
  if (text === null) return <div className={`${styles.tile} ${styles.tileEmpty}`} aria-hidden="true" />
  const cls = { selected: styles.tileSelected, right: styles.tileRight, wrong: styles.tileWrong }[state] || ''
  return (
    <button className={`${styles.tile} ${cls}`} lang={lang} onClick={onClick} aria-pressed={state === 'selected'}>
      {text}
    </button>
  )
}

function Round({ pool, onFinish }) {
  const [board, setBoard] = useState(() => refill(emptyBoard(), pool, []))
  const [selected, setSelected] = useState(null)
  const [flash, setFlash] = useState(null)
  const [matches, setMatches] = useState(0)
  const [now, setNow] = useState(Date.now())
  const deadline = useRef(Date.now() + ROUND_MS)
  const matchesRef = useRef(0)

  const remaining = Math.max(0, deadline.current - now)

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 100)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (remaining === 0) onFinish(matchesRef.current)
  }, [remaining]) // eslint-disable-line react-hooks/exhaustive-deps

  function tap(side, slot) {
    if (flash) return
    if (!selected || selected.side === side) {
      setSelected(selected?.side === side && selected.slot === slot ? null : { side, slot })
      return
    }
    const l = side === 'left' ? slot : selected.slot
    const r = side === 'right' ? slot : selected.slot
    const li = board.left[l], ri = board.right[r]
    setSelected(null)

    if (pool[li].right !== pool[ri].right) {
      playWrong()
      setFlash({ kind: 'wrong', l, r })
      setTimeout(() => setFlash(null), 350)
      return
    }
    playCorrect()
    matchesRef.current += 1
    setMatches(matchesRef.current)
    setFlash({ kind: 'right', l, r })
    setTimeout(() => {
      setBoard(b => {
        const cleared = { left: [...b.left], right: [...b.right] }
        cleared.left[l] = null
        cleared.right[r] = null
        return refill(cleared, pool, [li, ri])
      })
      setFlash(null)
    }, 220)
  }

  function tileState(side, slot) {
    if (flash && (side === 'left' ? flash.l : flash.r) === slot) return flash.kind
    if (selected?.side === side && selected.slot === slot) return 'selected'
    return null
  }

  const text = (side, slot) => {
    const idx = board[side][slot]
    return idx === null ? null : pool[idx][side]
  }

  return (
    <div className={styles.play}>
      <div className={styles.playTop}>
        <div className={styles.timer} role="timer" aria-label={`${Math.ceil(remaining / 1000)} seconds left`}>
          <div className={`${styles.timerFill} ${remaining < 10000 ? styles.timerLow : ''}`} style={{ width: `${(remaining / ROUND_MS) * 100}%` }} />
        </div>
        <span className={styles.score} aria-live="polite">
          <img src="/icons/green_checkmark.png" alt="" width={20} height={20} />{matches}
        </span>
      </div>
      <div className={styles.board}>
        {['left', 'right'].map(side => (
          <div key={side} className={styles.column}>
            {board[side].map((_, slot) => (
              <Tile
                key={slot}
                text={text(side, slot)}
                lang={side === 'left' ? 'bg' : undefined}
                state={tileState(side, slot)}
                onClick={() => tap(side, slot)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function SpeedInner() {
  const params = useSearchParams()
  const modeId = params.get('mode') === 'letters' ? 'letters' : 'words'
  const mode = MODES[modeId]
  const { state, hydrated, completeSpeedRound } = useProgress()
  const [phase, setPhase] = useState('intro')
  const [result, setResult] = useState(null)
  const [roundKey, setRoundKey] = useState(0)

  const pool = useMemo(() => (hydrated ? mode.pool(state.lessons) : []), [hydrated, modeId]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!hydrated) return <LoadingBear />

  const best = state.speedBest?.[modeId] || 0

  function start() {
    unlockAudio()
    setRoundKey(k => k + 1)
    setPhase('play')
  }

  function finish(matches) {
    const xp = Math.min(MAX_XP, Math.ceil(matches / 2))
    setResult({ matches, xp, newBest: matches > best && matches > 0 })
    if (matches > 0) completeSpeedRound(modeId, matches, xp)
    setPhase('done')
  }

  let body
  if (pool.length < MIN_SPEED_ITEMS) {
    body = (
      <div className={styles.center}>
        <Bear mood="happy" size={100} />
        <h2 className={styles.centerTitle}>Learn a few more first</h2>
        <p className={styles.centerText}>A speed round needs at least {MIN_SPEED_ITEMS} {modeId} you have learned. Finish another lesson and come back.</p>
        <Link href={mode.learnHref} className={styles.primaryBtn}>GO TO LESSONS</Link>
      </div>
    )
  } else if (phase === 'play') {
    body = <Round key={roundKey} pool={pool} onFinish={finish} />
  } else if (phase === 'done') {
    body = (
      <div className={styles.center}>
        <Bear mood={result.matches ? 'cheer' : 'happy'} size={100} />
        <h2 className={styles.centerTitle}>Time is up!</h2>
        <div className={styles.bigNumber}>{result.matches}</div>
        <p className={styles.centerText}>{result.matches === 1 ? 'match' : 'matches'} in 60 seconds</p>
        {result.newBest && <span className={styles.newBest}>NEW PERSONAL BEST</span>}
        {result.xp > 0 && (
          <span className={styles.xpGain}><img src="/icons/lightning.png" alt="" width={20} height={20} />+{result.xp} XP</span>
        )}
        <div className={styles.btnRow}>
          <button className={styles.primaryBtn} onClick={start}>PLAY AGAIN</button>
          <Link href={mode.back} className={styles.secondaryBtn}>Done</Link>
        </div>
      </div>
    )
  } else {
    body = (
      <div className={styles.center}>
        <Bear mood="happy" size={100} />
        <h2 className={styles.centerTitle}>{mode.title}</h2>
        <p className={styles.centerText}>
          Match as many pairs as you can in 60 seconds. Tap a Bulgarian {modeId === 'letters' ? 'letter' : 'word'}, then its match.
        </p>
        {best > 0 && <p className={styles.centerText}>Your best: <strong>{best}</strong></p>}
        <button className={styles.primaryBtn} onClick={start} autoFocus>START</button>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href={mode.back} className={styles.backBtn}><Chevron /> {modeId === 'letters' ? 'Letters' : 'Words'}</Link>
        <h1 className={styles.headerTitle}>{mode.title}</h1>
      </header>
      {body}
    </div>
  )
}

export default function SpeedPage() {
  return (
    <Suspense fallback={<LoadingBear />}>
      <SpeedInner />
    </Suspense>
  )
}
