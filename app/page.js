'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { COURSE } from '../data/course'
import { useProgress } from '../hooks/useProgress'
import { hapticTap, unlockAudio } from '../lib/audio'
import styles from './page.module.css'

function HeartTimer({ nextHeartInMs }) {
  const [ms, setMs] = useState(nextHeartInMs)
  useEffect(() => {
    setMs(nextHeartInMs)
    if (nextHeartInMs <= 0) return
    const t = setInterval(() => setMs(m => Math.max(0, m - 1000)), 1000)
    return () => clearInterval(t)
  }, [nextHeartInMs])
  if (ms <= 0) return null
  const mins = Math.floor(ms / 60000)
  const secs = Math.floor((ms % 60000) / 1000)
  return <span className={styles.heartTimer}>{mins}:{secs.toString().padStart(2, '0')}</span>
}

function LessonNode({ lesson, levelLessons, idx, levelColor, isComplete, isUnlocked, levelId, isLast, levelIndex }) {
  const [showTooltip, setShowTooltip] = useState(false)
  const [pressed, setPressed] = useState(false)
  const nodeRef = useRef(null)

  useEffect(() => {
    if (!showTooltip) return
    const handler = (e) => { if (!nodeRef.current?.contains(e.target)) setShowTooltip(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showTooltip])

  const isCurrent = isUnlocked && !isComplete
  const lessonNum = idx + 1
  const totalInLevel = levelLessons.length
  const displayTitle = isLast ? `Level ${levelIndex + 1} Review` : lesson.title

  function handleToggle() {
    setShowTooltip(v => !v)
  }

  function handlePress() {
    setPressed(true)
    hapticTap()
  }

  function handleRelease() {
    setPressed(false)
  }

  return (
    <div className={styles.nodeWrap} ref={nodeRef}>
      {isCurrent && (
        <div className={`${styles.startLabel} ${showTooltip ? styles.startLabelHide : ''}`}>START</div>
      )}
      <button
        className={`${styles.node} ${
          !isUnlocked ? styles.nodeLocked
          : isComplete ? styles.nodeComplete
          : styles.nodeCurrent
        } ${pressed ? styles.nodePressed : ''}`}
        style={isComplete ? { background: levelColor, borderColor: levelColor, boxShadow: `0 4px 0 color-mix(in srgb, ${levelColor} 60%, #000)` }
          : isCurrent ? { borderColor: levelColor, boxShadow: `0 4px 0 var(--border-hi)` } : {}}
        onClick={handleToggle}
        onPointerDown={handlePress}
        onPointerUp={handleRelease}
        onPointerLeave={handleRelease}
        onPointerCancel={handleRelease}
        aria-label={displayTitle}
      >
        {isComplete ? <span className={styles.nodeCheck}><img src="/icons/green_checkmark.png" alt="✓" width={44} height={44} /></span>
          : !isUnlocked ? <span className={styles.lockIcon}><img src="/icons/lock.png" alt="locked" width={36} height={36} /></span>
          : <span className={styles.nodeNum}>{lessonNum}</span>}
      </button>

      {showTooltip && (
        isUnlocked ? (
          <div className={styles.tooltip}>
            <div className={styles.tooltipTitle}>{displayTitle}</div>
            <div className={styles.tooltipSub}>Lesson {lessonNum} of {totalInLevel}</div>
            <Link
              href={`/lesson/${lesson.id}?level=${levelId}`}
              className={styles.tooltipBtn}
              style={{ background: levelColor }}
              onClick={() => { unlockAudio(); setShowTooltip(false) }}
            >
              {isComplete ? `PRACTICE +${Math.ceil(lesson.xp / 2)} XP` : `START +${lesson.xp} XP`}
            </Link>
          </div>
        ) : (
          <div className={`${styles.tooltip} ${styles.tooltipLocked}`}>
            <div className={styles.tooltipTitle}>{displayTitle}</div>
            <div className={styles.tooltipSub}>Complete all lessons above to unlock this!</div>
            <div className={styles.tooltipBtnLocked}>LOCKED</div>
          </div>
        )
      )}
    </div>
  )
}

function ShopModal({ state, MAX_HEARTS, HEART_COST_XP, buyHearts, STREAK_FREEZE_COST_XP, buyStreakFreeze, onClose }) {
  const canAfford = state.xp >= HEART_COST_XP
  const atMax = state.hearts >= MAX_HEARTS

  return (
    <div className={styles.shopOverlay} onClick={onClose}>
      <div className={styles.shopCard} onClick={e => e.stopPropagation()}>
        <button className={styles.shopClose} onClick={onClose}><img src="/icons/gray_x.png" alt="✕" width={14} height={14} /></button>
        <div className={styles.shopEmoji}><img src="/icons/gift_box.png" alt="shop" width={52} height={52} /></div>
        <h2 className={styles.shopTitle}>Shop</h2>
        <div className={styles.shopStats}>
          <span><img src="/icons/filled_heart.png" alt="❤" width={16} height={16} style={{ verticalAlign: 'middle', marginRight: 4 }} />{state.hearts}/{MAX_HEARTS}</span>
          <span><img src="/icons/lightning.png" alt="⚡" width={16} height={16} style={{ verticalAlign: 'middle', marginRight: 4 }} />{state.xp} XP</span>
        </div>
        <div className={styles.shopItem}>
          <div className={styles.shopItemInfo}>
            <span className={styles.shopItemIcon}><img src="/icons/filled_heart.png" alt="❤" width={26} height={26} /></span>
            <div>
              <div className={styles.shopItemName}>1 Heart</div>
              <div className={styles.shopItemCost}>{HEART_COST_XP} XP</div>
            </div>
          </div>
          <button
            className={styles.shopBuyBtn}
            onClick={() => { if (!atMax && canAfford) buyHearts(1) }}
            disabled={!canAfford || atMax}
          >
            {atMax ? 'Full' : canAfford ? 'Buy' : 'Need XP'}
          </button>
        </div>
        <div className={styles.shopItem}>
          <div className={styles.shopItemInfo}>
            <span className={styles.shopItemIcon}><img src="/icons/heart_with_flame.png" alt="❤️‍🔥" width={26} height={26} /></span>
            <div>
              <div className={styles.shopItemName}>5 Hearts</div>
              <div className={styles.shopItemCost}>{HEART_COST_XP * 5} XP</div>
            </div>
          </div>
          <button
            className={styles.shopBuyBtn}
            onClick={() => { if (!atMax && state.xp >= HEART_COST_XP * 5) buyHearts(5) }}
            disabled={state.xp < HEART_COST_XP * 5 || atMax}
          >
            {atMax ? 'Full' : state.xp >= HEART_COST_XP * 5 ? 'Buy' : 'Need XP'}
          </button>
        </div>

        <div className={styles.shopItem}>
          <div className={styles.shopItemInfo}>
            <span className={styles.shopItemIcon}><img src="/icons/shield.png" alt="🛡" width={26} height={26} /></span>
            <div>
              <div className={styles.shopItemName}>Streak Freeze</div>
              <div className={styles.shopItemCost}>{STREAK_FREEZE_COST_XP} XP · Have: {state.streakFreezes || 0}</div>
            </div>
          </div>
          <button
            className={styles.shopBuyBtn}
            onClick={() => { if (state.xp >= STREAK_FREEZE_COST_XP) buyStreakFreeze() }}
            disabled={state.xp < STREAK_FREEZE_COST_XP}
          >
            {state.xp >= STREAK_FREEZE_COST_XP ? 'Buy' : 'Need XP'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  const { state, hydrated, isLessonComplete, isLessonUnlocked, nextHeartInMs, buyHearts, HEART_COST_XP, buyStreakFreeze, STREAK_FREEZE_COST_XP, MAX_HEARTS, skipLevel, unskipLevel } = useProgress()
  const [visibleLevel, setVisibleLevel] = useState(0)
  const [showShop, setShowShop] = useState(false)
  const levelRefs = useRef([])

  useEffect(() => {
    const handleScroll = () => {
      // Switch level when the section top crosses the sticky header+banner area (~130px)
      const threshold = 130
      let current = 0
      COURSE.levels.forEach((_, i) => {
        const el = levelRefs.current[i]
        if (el) {
          const top = el.getBoundingClientRect().top
          if (top <= threshold) current = i
        }
      })
      setVisibleLevel(current)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [hydrated])

  const currentLevel = COURSE.levels[visibleLevel]

  if (!hydrated) return <div className={styles.loading}>Loading…</div>

  return (
    <div className={styles.page}>
      {showShop && (
        <ShopModal
          state={state}
          MAX_HEARTS={MAX_HEARTS}
          HEART_COST_XP={HEART_COST_XP}
          buyHearts={buyHearts}
          STREAK_FREEZE_COST_XP={STREAK_FREEZE_COST_XP}
          buyStreakFreeze={buyStreakFreeze}
          onClose={() => setShowShop(false)}
        />
      )}

      {/* ── Header ── */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.logo}>
            <img src="/icons/bulgarian_flag.png" alt="🇧🇬" className={styles.logoFlag} width={34} height={34} />
            <span className={styles.logoName}>Learn Bulgarian</span>
          </div>
          <div className={styles.headerStats}>
            <div className={styles.streak}>
              <span className={styles.streakFlame}><img src="/icons/fire.png" alt="🔥" width={26} height={26} /></span>
              <span className={styles.streakNum}>{state.streak}</span>
            </div>
            <div className={styles.hearts}>
              <span className={styles.heartIcon}><img src="/icons/filled_heart.png" alt="❤" width={26} height={26} /></span>
              <span className={styles.heartNum}>{state.hearts}/{MAX_HEARTS}</span>
              <HeartTimer nextHeartInMs={nextHeartInMs()} />
            </div>
            <div className={styles.xp}>
              <span className={styles.xpIcon}><img src="/icons/lightning.png" alt="⚡" width={24} height={24} /></span>
              <span className={styles.xpNum}>{state.xp} XP</span>
            </div>
            <button className={styles.shopBtn} onClick={() => setShowShop(true)} title="Shop">
              <img src="/icons/gift_box.png" alt="🎁" width={28} height={28} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Sticky level banner ── */}
      <div className={styles.levelBanner}>
        <div className={styles.bannerInner} style={{ background: currentLevel.color }}>
          <div className={styles.bannerLeft}>
            <span className={styles.bannerUnit}>SECTION {visibleLevel + 1}</span>
            <span className={styles.bannerTitle}>{currentLevel.title} · {currentLevel.subtitle}</span>
          </div>
          <Link href={`/level/${currentLevel.id}`} className={styles.guidebookBtn}>
            <img src="/icons/open_book.png" alt="📖" width={24} height={24} /> NOTES
          </Link>
        </div>
      </div>

      {/* ── Course map ── */}
      <main className={styles.main}>
        {COURSE.levels.map((level, li) => {
          return (
            <section
              key={level.id}
              className={styles.levelSection}
              ref={el => levelRefs.current[li] = el}
            >
              {/* Level divider */}
              <div className={styles.levelDivider}>
                <div className={styles.dividerLine} />
                <span className={styles.dividerLabel}>{level.title}</span>
                <div className={styles.dividerLine} />
              </div>

              {/* Skip / skipped row — first level only */}
              {li === 0 && (
                state.skippedLevels?.[level.id]
                  ? (
                    <div className={styles.skippedRow}>
                      <span className={styles.skippedNote}>Alphabet skipped, lessons still available above</span>
                      <button className={styles.unskipBtn} onClick={() => unskipLevel(level.id)}>Undo</button>
                    </div>
                  ) : (
                    <div className={styles.skipRow}>
                      <span className={styles.skipText}>Already know Cyrillic?</span>
                      <button className={styles.skipLevelBtn} onClick={() => { skipLevel(level.id); setTimeout(() => { const el = levelRefs.current[1]; if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 200, behavior: 'smooth' }) }, 50) }}>Skip alphabet</button>
                    </div>
                  )
              )}

              {/* Lesson path - zigzag */}
              <div className={styles.lessonPath}>
                {level.lessons.map((lesson, idx) => {
                  const complete = isLessonComplete(lesson.id)
                  const prevLevel = li > 0 ? COURSE.levels[li - 1] : null
                  const unlocked = isLessonUnlocked(level.lessons, idx, prevLevel?.lessons ?? null, prevLevel?.id ?? null)
                  const positions = ['center', 'right', 'center', 'left', 'center', 'right', 'center', 'left']
                  const pos = positions[idx % positions.length]

                  return (
                    <div key={lesson.id} className={`${styles.pathStep} ${styles[`pos_${pos}`]}`}>
                      <LessonNode
                        lesson={lesson}
                        levelLessons={level.lessons}
                        idx={idx}
                        levelColor={level.color}
                        isComplete={complete}
                        isUnlocked={unlocked}
                        levelId={level.id}
                        isLast={idx === level.lessons.length - 1}
                        levelIndex={li}
                      />
                    </div>
                  )
                })}
              </div>

            </section>
          )
        })}
      </main>
    </div>
  )
}
