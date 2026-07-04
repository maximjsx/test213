'use client'
import { useEffect, useState } from 'react'
import { playLevelComplete, playPerfect } from '../lib/audio'
import Bear from './Bear'
import styles from './LessonComplete.module.css'

// Counts up from 0 to the target over ~0.9s with an ease-out
function useCountUp(target, dur = 900) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!target) return
    let raf
    const start = performance.now()
    const tick = (now) => {
      const t = Math.min((now - start) / dur, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setValue(Math.round(target * eased))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, dur])
  return value
}

function getExerciseDisplay(ex) {
  if (!ex) return { q: '—', a: '—' }
  switch (ex.type) {
    case 'translate_to_en':
    case 'translate_to_bg':
    case 'word_bank':
      return { q: ex.prompt, a: ex.answer || ex.answers?.[0] || '—' }
    case 'multiple_choice':
      return { q: ex.question, a: ex.answer }
    case 'fill_blank':
      return { q: ex.sentence, a: ex.answer }
    case 'match_pairs':
      return { q: ex.instruction, a: ex.pairs?.map(p => `${p.left} → ${p.right}`).join('  ·  ') || '—' }
    case 'listen_and_type':
      return { q: ex.tts, a: ex.answer }
    case 'listen_translate':
      return { q: ex.tts, a: ex.answers?.[0] || '—' }
    case 'speak_sentence':
      return { q: ex.tts, a: ex.tts }
    default:
      return { q: '—', a: ex.answer || ex.answers?.[0] || '—' }
  }
}

// One Duolingo-style stat tile: a colored label bar over a value with an icon.
function StatTile({ color, label, icon, value }) {
  return (
    <div className={styles.tile} style={{ borderColor: color }}>
      <div className={styles.tileHead} style={{ background: color }}>{label}</div>
      <div className={styles.tileBody} style={{ color }}>
        {icon && <img src={icon} alt="" width={20} height={20} />}
        <span>{value}</span>
      </div>
    </div>
  )
}

export default function LessonComplete({ lesson, level, score, xpEarned, onContinue, onRetry, mistakes = [], prevWrongIds = {} }) {
  const pct = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0
  const perfect = score.total > 0 && score.correct === score.total
  const combo = score.maxCombo ?? 0

  const uniqueMistakes = mistakes.filter((m, i) => mistakes.findIndex(x => x.id === m.id) === i)
  const shownXp = useCountUp(xpEarned ?? lesson.xp)
  const shownPct = useCountUp(pct)

  useEffect(() => {
    if (perfect) playPerfect()
    else playLevelComplete()
  }, [])

  const accuracyColor = pct >= 80 ? 'var(--green)' : pct >= 50 ? 'var(--orange)' : 'var(--red)'

  return (
    <div className={styles.wrap}>
      <div className={styles.content}>
        {perfect && <div className={styles.perfectBanner}>Perfect Lesson</div>}

        <div className={styles.bear}>
          <Bear mood={perfect ? 'cheer' : pct >= 60 ? 'happy' : 'sad'} size={104} />
        </div>
        <h1 className={styles.title}>
          {perfect ? 'Flawless!' : pct >= 60 ? 'Lesson Complete!' : 'Keep Practicing!'}
        </h1>

        <div className={styles.tiles}>
          <StatTile color="var(--yellow)" label="Total XP" icon="/icons/lightning.png" value={`+${shownXp}`} />
          <StatTile color={accuracyColor} label="Accuracy" value={`${shownPct}%`} />
          {combo >= 3 && (
            <StatTile color="var(--orange)" label="Best Combo" icon="/icons/fire.png" value={combo} />
          )}
        </div>

        {uniqueMistakes.length > 0 && (
          <div className={styles.mistakeSection}>
            <div className={styles.mistakeSectionTitle}>Review Mistakes</div>
            {uniqueMistakes.map(ex => {
              const { q, a } = getExerciseDisplay(ex)
              const isPrev = (prevWrongIds[ex.id] || 0) > 0
              return (
                <div key={ex.id} className={styles.mistakeItem}>
                  {isPrev && <div className={styles.prevBadge}>Previous mistake</div>}
                  <div className={styles.mistakeQ}>{q}</div>
                  <div className={styles.mistakeA}><img src="/icons/green_checkmark.png" alt="" width={14} height={14} style={{ verticalAlign: 'middle', marginRight: 5 }} />{a}</div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className={styles.footer}>
        <div className={styles.footerInner}>
          <button className={styles.retryBtn} onClick={onRetry}>Try Again</button>
          <button className={styles.continueBtn} style={{ background: level.color, boxShadow: `0 4px 0 color-mix(in srgb, ${level.color} 65%, #000)` }} onClick={onContinue}>
            CONTINUE
          </button>
        </div>
      </div>
    </div>
  )
}
