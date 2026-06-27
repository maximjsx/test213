'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import MultipleChoice from './exercises/MultipleChoice'
import TranslateInput from './exercises/TranslateInput'
import FillBlank from './exercises/FillBlank'
import MatchPairs from './exercises/MatchPairs'
import WordBank from './exercises/WordBank'
import SpeakSentence from './exercises/SpeakSentence'
import ListenAndType from './exercises/ListenAndType'
import ListenTranslate from './exercises/ListenTranslate'
import Introduce from './exercises/Introduce'
import { playCorrect, playWrong, playAllHeartsLost } from '../lib/audio'
import styles from './ExerciseRunner.module.css'

const EXERCISE_MAP = {
  multiple_choice: MultipleChoice,
  translate_to_en: TranslateInput,
  translate_to_bg: TranslateInput,
  fill_blank: FillBlank,
  match_pairs: MatchPairs,
  word_bank: WordBank,
  speak_sentence: SpeakSentence,
  listen_and_type: ListenAndType,
  listen_translate: ListenTranslate,
  introduce: Introduce,
}

export default function ExerciseRunner({ lesson, level, exercises, hearts, maxHearts, xp, heartCostXp, onLoseHeart, onBuyHeart, onComplete, onQuit }) {
  const [queue, setQueue] = useState(exercises)
  const [current, setCurrent] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [mistakes, setMistakes] = useState([])
  const [retriedMistakes, setRetriedMistakes] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [pendingAnswer, setPendingAnswer] = useState(false)
  const [checkTrigger, setCheckTrigger] = useState(0)
  const [useKeyboard, setUseKeyboard] = useState(false)
  const [noHeartsModal, setNoHeartsModal] = useState(false)
  const [showQuitConfirm, setShowQuitConfirm] = useState(false)
  const [key, setKey] = useState(0)
  const feedbackSetAt = useRef(null)
  const prevHeartsRef = useRef(hearts)

  const exercise = queue[current]
  const progress = Math.min(current / exercises.length, 1)
  const isWordBank = exercise?.type === 'word_bank'

  useEffect(() => {
    if (hearts <= 0) {
      setNoHeartsModal(true)
      if (prevHeartsRef.current > 0) playAllHeartsLost()
    }
    prevHeartsRef.current = hearts
  }, [hearts])

  // Back-button trap: intercept browser back to show quit confirmation
  useEffect(() => {
    window.history.pushState({ lessonActive: true }, '')
    function onPopState() {
      window.history.pushState({ lessonActive: true }, '')
      setShowQuitConfirm(true)
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key !== 'Enter') return
      if (feedback) {
        if (Date.now() - (feedbackSetAt.current ?? 0) < 300) return
        handleNext()
      } else if (pendingAnswer) {
        setCheckTrigger(t => t + 1)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [feedback, pendingAnswer, handleNext])

  useEffect(() => {
    setPendingAnswer(exercise?.type === 'introduce')
    setCheckTrigger(0)
    setFeedback(null)
    setUseKeyboard(false)
  }, [current, key]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleAnswer = useCallback((isCorrect, message = '') => {
    feedbackSetAt.current = Date.now()
    if (isCorrect) {
      playCorrect()
      setCorrect(c => c + 1)
      setFeedback({ ok: true, message: 'Great!' })
    } else {
      playWrong()
      onLoseHeart()
      setMistakes(m => [...m, exercise])
      setFeedback({ ok: false, message: message || `Correct answer: "${exercise.answer}"` })
    }
  }, [exercise, onLoseHeart])

  function handleCheck() {
    if (!pendingAnswer || feedback) return
    setCheckTrigger(t => t + 1)
  }

  function handleSkip() {
    if (feedback) return
    playWrong()
    onLoseHeart()
    setMistakes(m => [...m, exercise])
    setFeedback({ ok: false, message: `Correct answer: "${exercise?.answer || '?'}"` })
  }

  function handleNext() {
    setFeedback(null)
    setCheckTrigger(0)
    if (current + 1 >= queue.length) {
      if (!retriedMistakes && mistakes.length > 0) {
        const retries = mistakes.map(ex => ({ ...ex, isPreviousMistake: true }))
        setQueue(q => [...q, ...retries])
        setMistakes([])
        setRetriedMistakes(true)
        setCurrent(c => c + 1)
        setKey(k => k + 1)
      } else {
        onComplete({ correct, total: exercises.length, mistakes })
      }
    } else {
      setCurrent(c => c + 1)
      setKey(k => k + 1)
    }
  }

  const ExComponent = EXERCISE_MAP[exercise?.type]
  const isSpeakExercise = exercise?.type === 'speak_sentence'
  const isIntroExercise = exercise?.type === 'introduce'

  function handleBuyHeart() {
    onBuyHeart()
    setNoHeartsModal(false)
  }

  if (noHeartsModal) {
    const canAfford = xp >= heartCostXp
    return (
      <div className={styles.noHeartsWrap}>
        <div className={styles.noHeartsCard}>
          <div className={styles.noHeartsEmoji}><img src="/icons/broken_heart.png" alt="💔" width={64} height={64} /></div>
          <h2 className={styles.noHeartsTitle}>You ran out of hearts!</h2>
          <p className={styles.noHeartsText}>Hearts refill in 30 minutes. Check the guidebook to review the material.</p>
          {canAfford && (
            <button className={styles.refillBtn} onClick={handleBuyHeart}>
              <img src="/icons/filled_heart.png" alt="❤" width={18} height={18} style={{ verticalAlign: 'middle', marginRight: 6 }} />Refill 1 Heart ({heartCostXp} XP)
            </button>
          )}
          {!canAfford && (
            <p className={styles.noXpText}>Not enough XP to refill. ({xp}/{heartCostXp} XP)</p>
          )}
          <Link href={`/level/${level.id}`} className={styles.guidebookBtnLarge} style={{ background: level.color }}>
            <img src="/icons/open_book.png" alt="📖" width={18} height={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />Read Notes
          </Link>
          <button className={styles.quitBtn2} onClick={onQuit}>← Back to Course</button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.wrap}>
      {showQuitConfirm && (
        <div className={styles.quitModalOverlay}>
          <div className={styles.quitModalCard}>
            <div className={styles.quitModalEmoji}>😟</div>
            <h3 className={styles.quitModalTitle}>Quit lesson?</h3>
            <p className={styles.quitModalText}>
              You'll have to start this lesson over from the beginning if you quit now.
            </p>
            <button className={styles.quitConfirmBtn} onClick={onQuit}>QUIT</button>
            <button className={styles.quitCancelBtn} onClick={() => setShowQuitConfirm(false)}>KEEP LEARNING</button>
          </div>
        </div>
      )}

      <div className={styles.topBar}>
        <div className={styles.topBarInner}>
          <button className={styles.quitBtn} onClick={() => setShowQuitConfirm(true)}><img src="/icons/gray_x.png" alt="✕" width={14} height={14} /></button>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${progress * 100}%`, background: level.color }} />
          </div>
          <div className={styles.heartsDisplay}>
            <span className={styles.heartEmoji}><img src="/icons/filled_heart.png" alt="❤" width={20} height={20} /></span>
            <span className={styles.heartCount}>{hearts}</span>
          </div>
        </div>
      </div>

      <div className={styles.area}>
        <div className={styles.areaContent}>
          {exercise?.isPreviousMistake && (
            <div className={styles.prevMistakeBanner}>
              ↩ Previous mistake, try again!
            </div>
          )}
          {ExComponent && (
            <ExComponent
              key={key}
              exercise={exercise}
              onAnswer={handleAnswer}
              onPendingChange={setPendingAnswer}
              checkTrigger={checkTrigger}
              disabled={!!feedback}
              levelColor={level.color}
              useKeyboard={useKeyboard}
            />
          )}
        </div>
      </div>

      {feedback ? (
        <div className={`${styles.feedbackBar} ${feedback.ok ? styles.ok : styles.bad}`}>
          <div className={styles.feedbackInner}>
            <div className={styles.feedbackLeft}>
              <div className={`${styles.feedbackIcon} ${feedback.ok ? styles.iconOk : styles.iconBad}`}>
                <img src={feedback.ok ? '/icons/green_checkmark.png' : '/icons/red_x.png'} alt={feedback.ok ? '✓' : '✗'} width={22} height={22} />
              </div>
              <div>
                <div className={styles.feedbackTitle}>{feedback.ok ? 'Correct!' : 'Incorrect'}</div>
                <div className={styles.feedbackMsg}>{feedback.message}</div>
              </div>
            </div>
            <button
              className={`${styles.continueBtn} ${feedback.ok ? styles.continueBtnOk : styles.continueBtnBad}`}
              onClick={handleNext}
            >
              {current + 1 >= queue.length ? 'FINISH' : 'CONTINUE'}
            </button>
          </div>
        </div>
      ) : exercise?.type !== 'match_pairs' ? (
        <div className={styles.checkBar}>
          <div className={styles.checkBarInner}>
            {!isIntroExercise && (
              <button className={styles.skipBtn} onClick={handleSkip}>{isSpeakExercise ? "CAN'T SPEAK NOW" : 'SKIP'}</button>
            )}
            {isWordBank && (
              <button
                className={`${styles.useKeyboardBtn} ${useKeyboard ? styles.useKeyboardActive : ''}`}
                onClick={() => setUseKeyboard(v => !v)}
              >
                <span className={styles.keyboardIcon}><img src="/icons/keyboard.png" alt="⌨" width={24} height={24} /></span>
                {useKeyboard ? 'USE TILES' : 'USE KEYBOARD'}
              </button>
            )}
            {!isSpeakExercise && (
              <button
                className={`${styles.checkBarBtn} ${pendingAnswer ? styles.checkBarBtnActive : ''}`}
                onClick={handleCheck}
                disabled={!pendingAnswer}
                style={isIntroExercise ? { marginLeft: 'auto' } : undefined}
              >
                {isIntroExercise ? 'GOT IT' : 'CHECK'}
              </button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
