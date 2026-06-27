'use client'
import { useEffect } from 'react'
import { playLevelComplete, playPerfect } from '../lib/audio'
import styles from './LessonComplete.module.css'

function getExerciseDisplay(ex) {
  if (!ex) return { q: '—', a: '—' }
  switch (ex.type) {
    case 'translate_to_en':
    case 'translate_to_bg':
    case 'word_bank':
      return { q: ex.prompt, a: ex.answer }
    case 'multiple_choice':
      return { q: ex.question, a: ex.answer }
    case 'fill_blank':
      return { q: ex.sentence, a: ex.answer }
    case 'match_pairs':
      return { q: ex.instruction, a: ex.pairs?.map(p => `${p.left} → ${p.right}`).join('  ·  ') || '—' }
    default:
      return { q: '—', a: ex.answer || '—' }
  }
}

export default function LessonComplete({ lesson, level, score, xpEarned, onContinue, onRetry, mistakes = [], prevWrongIds = {} }) {
  const pct = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0
  const perfect = score.total > 0 && score.correct === score.total

  const uniqueMistakes = mistakes.filter((m, i) => mistakes.findIndex(x => x.id === m.id) === i)

  useEffect(() => {
    if (perfect) playPerfect()
    else playLevelComplete()
  }, [])

  return (
    <div className={`${styles.wrap} ${perfect ? styles.wrapPerfect : ''}`}>
      <div className={`${styles.card} ${perfect ? styles.cardPerfect : ''}`}>
        {perfect && <div className={styles.perfectBanner}><img src="/icons/star.png" alt="⭐" width={18} height={18} style={{ verticalAlign: 'middle' }} /> PERFECT LESSON <img src="/icons/star.png" alt="⭐" width={18} height={18} style={{ verticalAlign: 'middle' }} /></div>}

        <div className={styles.emoji}>
          {perfect
            ? <img src="/icons/trophy_with_star.png" alt="🏆" width={80} height={80} />
            : pct >= 60
              ? <img src="/icons/party_popper.png" alt="🎉" width={80} height={80} />
              : <img src="/icons/sweaty_smile.png" alt="😅" width={80} height={80} />}
        </div>
        <h1 className={styles.title}>
          {perfect ? 'Flawless!' : pct >= 60 ? 'Lesson Complete!' : 'Keep Practicing!'}
        </h1>

        <div className={styles.xpBadge} style={{ background: level.color }}>
          +{xpEarned ?? lesson.xp} XP
        </div>

        <div className={styles.stats}>
          <div className={styles.stat}>
            <div className={styles.statVal} style={{ color: 'var(--green)' }}>{score.correct}</div>
            <div className={styles.statLbl}>Correct</div>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <div className={styles.statVal} style={{ color: score.total - score.correct > 0 ? 'var(--red)' : 'var(--text-dim)' }}>
              {score.total - score.correct}
            </div>
            <div className={styles.statLbl}>Errors</div>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <div className={styles.statVal} style={{ color: perfect ? 'var(--green)' : undefined }}>{pct}%</div>
            <div className={styles.statLbl}>Accuracy</div>
          </div>
        </div>

        {uniqueMistakes.length > 0 && (
          <div className={styles.mistakeSection}>
            <div className={styles.mistakeSectionTitle}>Review Mistakes</div>
            {uniqueMistakes.map(ex => {
              const { q, a } = getExerciseDisplay(ex)
              const isPrev = (prevWrongIds[ex.id] || 0) > 0
              return (
                <div key={ex.id} className={styles.mistakeItem}>
                  {isPrev && <div className={styles.prevBadge}>⚠ Previous mistake</div>}
                  <div className={styles.mistakeQ}>{q}</div>
                  <div className={styles.mistakeA}><img src="/icons/green_checkmark.png" alt="✓" width={14} height={14} style={{ verticalAlign: 'middle', marginRight: 5 }} />{a}</div>
                </div>
              )
            })}
          </div>
        )}

        <div className={styles.btns}>
          <button className={styles.continueBtn} style={{ background: level.color }} onClick={onContinue}>
            CONTINUE
          </button>
          <button className={styles.retryBtn} onClick={onRetry}>Try Again</button>
        </div>
      </div>
    </div>
  )
}
