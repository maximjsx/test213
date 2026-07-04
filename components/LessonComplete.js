'use client'
import { useEffect, useState, useMemo } from 'react'
import { playLevelComplete, playPerfect } from '../lib/audio'
import Bear from './Bear'
import styles from './LessonComplete.module.css'

const CONFETTI_COLORS = ['#ffc800', '#00cc7e', '#ff9600', '#1cb0f6', '#ce82ff', '#e8025e']

// A one-shot confetti burst for perfect lessons. Pieces shoot out and up from
// the center, decelerate to a peak, then arc back down under gravity with a bit
// of sideways sway — the two phases are eased separately in the keyframes.
function Confetti({ count = 64 }) {
  const pieces = useMemo(() => Array.from({ length: count }, (_, i) => {
    const angle = Math.random() * Math.PI * 2
    const dist = 120 + Math.random() * 280
    return {
      // Burst target: bias upward so pieces pop up-and-out before falling.
      dx: Math.cos(angle) * dist,
      dy: Math.sin(angle) * dist - 70,
      sway: (Math.random() - 0.5) * 140,
      fall: 240 + Math.random() * 300,
      rot: (Math.random() - 0.5) * 1000,
      dur: 2.3 + Math.random() * 1.4,
      delay: Math.random() * 0.1,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      w: 7 + Math.random() * 7,
    }
  }), [count])
  return (
    <div className={styles.confetti} aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={i}
          className={styles.confettiPiece}
          style={{
            background: p.color,
            width: `${p.w}px`, height: `${p.w * 0.6}px`,
            animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s`,
            '--dx': `${p.dx}px`, '--dy': `${p.dy}px`,
            '--sway': `${p.sway}px`, '--fall': `${p.fall}px`, '--rot': `${p.rot}deg`,
          }}
        />
      ))}
    </div>
  )
}

// Anime-style horizontal speed lines that whoosh past the running bear.
function SpeedLines() {
  return (
    <div className={styles.speedLines} aria-hidden="true">
      {Array.from({ length: 6 }, (_, i) => (
        <span key={i} className={styles.speedLine} style={{ top: `${8 + i * 15}%`, animationDelay: `${i * 0.11}s` }} />
      ))}
    </div>
  )
}

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
      {perfect && <Confetti />}
      <div className={styles.content}>
        {perfect && <div className={styles.perfectBanner}>Perfect Lesson</div>}

        <div className={styles.bearStage}>
          {perfect && <SpeedLines />}
          <div className={`${styles.bear} ${perfect ? styles.bearRun : ''}`}>
            <Bear mood={perfect ? 'cheer' : pct >= 60 ? 'happy' : 'sad'} size={104} />
          </div>
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
