'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { COURSE } from '../data/course'
import { useProgress } from '../hooks/useProgress'
import { useAuth } from '../hooks/useAuth'
import { claimableQuestCount } from '../lib/quests'
import { hapticTap, unlockAudio } from '../lib/audio'
import QuestsModal from '../components/QuestsModal'
import StreakModal from '../components/StreakModal'
import Bear from '../components/Bear'
import styles from './page.module.css'

const SPECIAL_PACKS = [
  { id: 'swear_words',  name: 'Swear Words',  icon: '🤬', costXP: 200, desc: 'Bulgarian profanity & adult slang' },
  { id: 'street_slang', name: 'Street Slang', icon: '😎', costXP: 150, desc: 'Informal expressions locals actually use' },
]

function LessonNode({ lesson, levelLessons, idx, levelColor, isComplete, isUnlocked, levelId, isLast, levelIndex, pos }) {
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

  function handleToggle() { setShowTooltip(v => !v) }
  function handlePress() { setPressed(true); hapticTap() }
  function handleRelease() { setPressed(false) }

  return (
    <div className={styles.nodeWrap} ref={nodeRef}>
      {isCurrent && (
        <div className={`${styles.startLabel} ${showTooltip ? styles.startLabelHide : ''}`}>START</div>
      )}
      {isCurrent && (
        <div className={`${styles.pathBear} ${pos === 'left' ? styles.pathBearRight : styles.pathBearLeft}`}>
          <Bear mood="idle" size={58} />
        </div>
      )}
      <button
        data-lesson-node
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

function LessonPathWithLines({ children, lessons, isLessonComplete, levelColor }) {
  const containerRef = useRef(null)
  const svgRef = useRef(null)

  useEffect(() => {
    function recompute() {
      const container = containerRef.current
      const svg = svgRef.current
      if (!container || !svg) return
      const cRect = container.getBoundingClientRect()
      const buttons = container.querySelectorAll('button[data-lesson-node]')
      const pts = Array.from(buttons).map(btn => {
        const r = btn.getBoundingClientRect()
        return { x: r.left + r.width / 2 - cRect.left, y: r.top + r.height / 2 - cRect.top }
      })
      while (svg.firstChild) svg.removeChild(svg.firstChild)
      if (pts.length < 2) return
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1]
        const midY = (a.y + b.y) / 2
        const d = `M${a.x},${a.y} C${a.x},${midY} ${b.x},${midY} ${b.x},${b.y}`
        const bothDone = isLessonComplete(lessons[i].id) && isLessonComplete(lessons[i + 1].id)
        const el = document.createElementNS('http://www.w3.org/2000/svg', 'path')
        el.setAttribute('d', d)
        el.setAttribute('fill', 'none')
        el.setAttribute('stroke-linecap', 'round')
        if (bothDone) {
          el.setAttribute('stroke', levelColor)
          el.setAttribute('stroke-width', '5')
          el.setAttribute('opacity', '0.55')
        } else {
          el.setAttribute('stroke', 'var(--border-hi)')
          el.setAttribute('stroke-width', '3')
          el.setAttribute('stroke-dasharray', '6 7')
          el.setAttribute('opacity', '0.45')
        }
        svg.appendChild(el)
      }
    }
    recompute()
    window.addEventListener('resize', recompute)
    return () => window.removeEventListener('resize', recompute)
  })

  return (
    <div className={styles.lessonPath} ref={containerRef}>
      <svg ref={svgRef} style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:0, overflow:'visible' }} />
      {children}
    </div>
  )
}

function ShopModal({ state, buyStreakFreeze, STREAK_FREEZE_COST_XP, unlockPack, onClose }) {
  return (
    <div className={styles.shopOverlay} onClick={onClose}>
      <div className={styles.shopCard} onClick={e => e.stopPropagation()}>
        <button className={styles.shopClose} onClick={onClose}><img src="/icons/gray_x.png" alt="✕" width={20} height={20} /></button>
        <div className={styles.shopEmoji}><img src="/icons/gift_box.png" alt="shop" width={52} height={52} /></div>
        <h2 className={styles.shopTitle}>Shop</h2>
        <div className={styles.shopStats}>
          <span><img src="/icons/lightning.png" alt="⚡" width={16} height={16} style={{ verticalAlign: 'middle', marginRight: 4 }} />{state.xp} XP available</span>
        </div>

        <div className={styles.shopSectionLabel}>Streak</div>
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

        <div className={styles.shopSectionLabel}>Special Packs</div>
        {SPECIAL_PACKS.map(pack => {
          const owned = state.specialUnlocks?.[pack.id]
          const canAfford = state.xp >= pack.costXP
          return (
            <div key={pack.id} className={`${styles.shopItem} ${owned ? styles.shopItemOwned : ''}`}>
              <div className={styles.shopItemInfo}>
                <span className={styles.shopItemIcon}>{pack.icon}</span>
                <div>
                  <div className={styles.shopItemName}>{pack.name}</div>
                  <div className={styles.shopItemCost}>{owned ? 'Unlocked' : `${pack.costXP} XP`}</div>
                </div>
              </div>
              {owned
                ? <div className={styles.shopOwnedBadge}>✓ Owned</div>
                : <button
                    className={styles.shopBuyBtn}
                    onClick={() => { if (canAfford) unlockPack(pack.id, pack.costXP) }}
                    disabled={!canAfford}
                  >
                    {canAfford ? 'Unlock' : 'Need XP'}
                  </button>
              }
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function HomePage() {
  const { state, hydrated, isLessonComplete, isLessonUnlocked, buyStreakFreeze, STREAK_FREEZE_COST_XP, unlockPack, skipLevel, unskipLevel, claimQuest } = useProgress()
  const { user } = useAuth()
  const [visibleLevel, setVisibleLevel] = useState(0)
  const [showShop, setShowShop] = useState(false)
  const [showQuests, setShowQuests] = useState(false)
  const [showStreak, setShowStreak] = useState(false)
  const [showJump, setShowJump] = useState(false)
  const levelRefs = useRef([])
  const currentLessonRef = useRef(null)

  useEffect(() => {
    const handleScroll = () => {
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

      const node = currentLessonRef.current
      if (node) {
        const r = node.getBoundingClientRect()
        setShowJump(r.bottom < 80 || r.top > window.innerHeight - 40)
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [hydrated])

  function jumpToCurrent() {
    const el = currentLessonRef.current
    if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY
    window.scrollTo({ top: Math.max(0, top - window.innerHeight / 2 + 60), behavior: 'smooth' })
  }

  useEffect(() => {
    if (!hydrated) return
    const el = currentLessonRef.current
    if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY
    window.scrollTo({ top: Math.max(0, top - window.innerHeight / 2 + 60), behavior: 'smooth' })
  }, [hydrated])

  const currentLevel = COURSE.levels[visibleLevel]
  const streakAtRisk = hydrated && state.streak > 0 && state.lastActiveDay !== new Date().toDateString()
  const claimable = claimableQuestCount(state.quests)
  const mistakeCount = Object.keys(state.wrongExercises || {}).length

  if (!hydrated) return <div className={styles.loading}>Loading…</div>

  return (
    <div className={styles.page}>
      {showShop && (
        <ShopModal
          state={state}
          buyStreakFreeze={buyStreakFreeze}
          STREAK_FREEZE_COST_XP={STREAK_FREEZE_COST_XP}
          unlockPack={unlockPack}
          onClose={() => setShowShop(false)}
        />
      )}
      {showQuests && (
        <QuestsModal quests={state.quests} claimQuest={claimQuest} onClose={() => setShowQuests(false)} />
      )}
      {showStreak && (
        <StreakModal state={state} onClose={() => setShowStreak(false)} />
      )}

      {/* ── Header ── */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.logo}>
            <img src="/icons/bulgarian_flag.png" alt="🇧🇬" className={styles.logoFlag} width={34} height={34} />
            <span className={styles.logoName}>
              Learn Bulgarian
              <sup className={styles.betaBadge}>Beta</sup>
            </span>
          </div>
          <div className={styles.headerStats}>
            <button className={`${styles.streak} ${styles.statBtn} ${streakAtRisk ? styles.streakAtRisk : ''}`} onClick={() => setShowStreak(true)} title="Streak calendar">
              <span className={styles.streakFlame}><img src="/icons/fire.png" alt="🔥" width={26} height={26} /></span>
              <span className={styles.streakNum}>{state.streak}</span>
            </button>
            <div className={styles.xp}>
              <span className={styles.xpIcon}><img src="/icons/lightning.png" alt="⚡" width={24} height={24} /></span>
              <span className={styles.xpNum}>{state.xp} XP</span>
            </div>
            <button className={styles.shopBtn} onClick={() => setShowQuests(true)} title="Daily quests">
              <img src="/icons/another_star.png" alt="quests" width={26} height={26} />
              {claimable > 0 && <span className={styles.questBadge}>{claimable}</span>}
            </button>
            <button className={styles.shopBtn} onClick={() => setShowShop(true)} title="Shop">
              <img src="/icons/gift_box.png" alt="🎁" width={28} height={28} />
            </button>
            <Link href="/leaderboard" className={`${styles.shopBtn} ${styles.leaderboardLink}`} title="Leaderboard">
              <img src="/icons/trophy.png" alt="leaderboard" width={26} height={26} />
            </Link>
            {user ? (
              <Link href="/profile" className={`${styles.shopBtn} ${styles.profileLink}`} title={user.username}>
                {user.avatarUrl
                  ? <img src={user.avatarUrl} alt="" width={30} height={30} style={{ borderRadius: '50%' }} />
                  : <Bear mood="idle" size={30} />}
              </Link>
            ) : (
              <Link href="/profile" className={styles.claimBtn} title="Sign in with Discord">
                CLAIM ACCOUNT
              </Link>
            )}
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
        {(() => { let foundCurrent = false; return COURSE.levels.map((level, li) => {
          return (
            <section
              key={level.id}
              className={styles.levelSection}
              ref={el => levelRefs.current[li] = el}
            >
              {(() => {
                const allDone = level.lessons.every(l => isLessonComplete(l.id))
                return (
                  <div className={`${styles.levelDivider} ${allDone ? styles.levelDividerComplete : ''}`}>
                    <div className={styles.dividerLine} />
                    <span className={styles.dividerLabel}>{level.title}{allDone ? ' ✓' : ''}</span>
                    <div className={styles.dividerLine} />
                  </div>
                )
              })()}

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

              <LessonPathWithLines lessons={level.lessons} isLessonComplete={isLessonComplete} levelColor={level.color}>
                {level.lessons.map((lesson, idx) => {
                  const complete = isLessonComplete(lesson.id)
                  const prevLevel = li > 0 ? COURSE.levels[li - 1] : null
                  const unlocked = isLessonUnlocked(level.lessons, idx, prevLevel?.lessons ?? null, prevLevel?.id ?? null)
                  const positions = ['center', 'right', 'center', 'left', 'center', 'right', 'center', 'left']
                  const pos = positions[idx % positions.length]

                  const isCurrent = unlocked && !complete
                  // Skipped levels stay unlocked for going back, but shouldn't
                  // claim the "current" spot ahead of the level the user jumped to
                  const eligibleForRef = isCurrent && !state.skippedLevels?.[level.id]
                  const assignRef = eligibleForRef && !foundCurrent ? (foundCurrent = true, true) : false
                  return (
                    <div key={lesson.id} className={`${styles.pathStep} ${styles[`pos_${pos}`]}`} ref={assignRef ? currentLessonRef : null}>
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
                        pos={pos}
                      />
                    </div>
                  )
                })}
              </LessonPathWithLines>
            </section>
          )
        })})()}

        {/* ── Special Packs ── */}
        <section className={styles.levelSection}>
          <div className={styles.levelDivider}>
            <div className={styles.dividerLine} />
            <span className={styles.dividerLabel}>Special Packs</span>
            <div className={styles.dividerLine} />
          </div>
          <div className={styles.packsGrid}>
            {SPECIAL_PACKS.map(pack => {
              const owned = state.specialUnlocks?.[pack.id]
              const canAfford = state.xp >= pack.costXP
              return (
                <div key={pack.id} className={`${styles.packCard} ${owned ? styles.packOwned : ''}`}>
                  <div className={styles.packCardIcon}>{pack.icon}</div>
                  <div className={styles.packCardName}>{pack.name}</div>
                  <div className={styles.packCardDesc}>{pack.desc}</div>
                  {owned
                    ? <div className={styles.packCardUnlocked}>✓ Unlocked</div>
                    : <button
                        className={styles.packCardBuyBtn}
                        onClick={() => { if (canAfford) unlockPack(pack.id, pack.costXP) }}
                        disabled={!canAfford}
                      >
                        {pack.costXP} XP {!canAfford && <span className={styles.packCardNeedMore}>· need more</span>}
                      </button>
                  }
                </div>
              )
            })}
          </div>
        </section>
      </main>

      {/* ── Floating actions ── */}
      <div className={styles.fabStack}>
        {mistakeCount > 0 && (
          <Link href="/practice" className={styles.practiceFab} title="Practice your mistakes">
            <img src="/icons/broken_heart.png" alt="" width={26} height={26} />
            <span className={styles.practiceFabCount}>{mistakeCount}</span>
          </Link>
        )}
        {showJump && (
          <button className={styles.jumpFab} onClick={jumpToCurrent} title="Back to current lesson">
            <img src="/icons/lightning.png" alt="" width={22} height={22} />
          </button>
        )}
      </div>
    </div>
  )
}
