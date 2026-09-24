'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { COURSE } from '../data/course'
import { useProgress } from '../hooks/useProgress'
import { useAuth } from '../hooks/useAuth'
import { useDialog } from '../hooks/useDialog'
import { claimableQuestCount } from '../lib/quests'
import { unlockAudio } from '../lib/audio'
import QuestsModal from '../components/QuestsModal'
import StreakModal from '../components/StreakModal'
import Bear from '../components/Bear'
import LoadingBear from '../components/LoadingBear'
import TopicTree from '../components/TopicTree'
import Certificates from '../components/Certificates'
import TopicArt from '../components/TopicArt'
import DailyGoal from '../components/DailyGoal'
import StreakMilestone from '../components/StreakMilestone'
import { pendingMilestone } from '../lib/goals'
import styles from './page.module.css'

const SPECIAL_PACKS = [
  { id: 'swear_words',  name: 'Swear Words',  icon: '🤬', costXP: 200, desc: 'Bulgarian profanity & adult slang' },
  { id: 'street_slang', name: 'Street Slang', icon: '😎', costXP: 150, desc: 'Informal expressions locals actually use' },
]

// Single source of truth for a pack's derived state, so the shop modal and the
// bottom packs grid can't drift apart on what counts as owned/affordable.
function packView(state, pack) {
  return {
    owned: !!state.specialUnlocks?.[pack.id],
    canAfford: state.xp >= pack.costXP,
  }
}

// Same rule as the map's resume marker: the first unlocked, incomplete lesson
function findResumeLesson(isLessonComplete, isLessonUnlocked) {
  for (const level of COURSE.levels) {
    const lesson = level.lessons.find((l, idx) => isLessonUnlocked(level.lessons, idx) && !isLessonComplete(l.id))
    if (lesson) return { lesson, level, levelId: level.id }
  }
  return null
}

// The one obvious next step, so starting a lesson is a single tap from home
function ResumeCard({ resume, isNew, streak, streakAtRisk, mistakeCount, onStart }) {
  const { lesson, level } = resume
  const idx = level.lessons.indexOf(lesson)
  const heading = streakAtRisk ? `Do one lesson to keep your ${streak}-day streak`
    : isNew ? 'Start here'
    : 'Up next'
  return (
    <section className={`${styles.resume} ${streakAtRisk ? styles.resumeAtRisk : ''}`} style={{ '--lvl': level.color }}>
      <div className={styles.resumeMain}>
        <span className={styles.resumeDisc} style={{ background: level.color }}>
          <TopicArt level={level} size={40} />
        </span>
        <div className={styles.resumeText}>
          <div className={styles.resumeHeading}>{heading}</div>
          <div className={styles.resumeTitle}>{level.title}: {lesson.title}</div>
          <div className={styles.resumeSub}>Lesson {idx + 1} of {level.lessons.length}</div>
        </div>
      </div>
      <button className={styles.resumeBtn} onClick={onStart}>
        START +{lesson.xp} XP
      </button>
      <PracticeLink count={mistakeCount} />
    </section>
  )
}

function PracticeLink({ count }) {
  if (!count) return null
  return (
    <Link href="/practice" className={styles.resumePractice}>
      <img src="/icons/broken_heart.png" alt="" width={18} height={18} />
      Practice {count} {count === 1 ? 'mistake' : 'mistakes'}
    </Link>
  )
}

const PRACTICE_LINKS = [
  { href: '/letters', label: 'Letters', icon: <span className={styles.practiceGlyph} lang="bg">Аа</span> },
  { href: '/words', label: 'Words', icon: <img src="/icons/open_book.png" alt="" width={28} height={28} /> },
  { href: '/speed?mode=words', label: 'Speed round', icon: <img src="/icons/lightning.png" alt="" width={28} height={28} /> },
]

function PracticeLinks() {
  return (
    <nav className={styles.practiceLinks} aria-label="Practice">
      {PRACTICE_LINKS.map(p => (
        <Link key={p.href} href={p.href} className={styles.practiceLink}>
          {p.icon}
          <span>{p.label}</span>
        </Link>
      ))}
    </nav>
  )
}

function ShopModal({ state, buyStreakFreeze, STREAK_FREEZE_COST_XP, unlockPack, onClose }) {
  const cardRef = useDialog(onClose)
  return (
    <div className={styles.shopOverlay} onClick={onClose}>
      <div className={styles.shopCard} ref={cardRef} role="dialog" aria-modal="true" aria-labelledby="shop-title" onClick={e => e.stopPropagation()}>
        <button className={styles.shopClose} onClick={onClose}><img src="/icons/gray_x.png" alt="Close" width={20} height={20} /></button>
        <div className={styles.shopEmoji}><img src="/icons/gift_box.png" alt="shop" width={52} height={52} /></div>
        <h2 id="shop-title" className={styles.shopTitle}>Shop</h2>
        <div className={styles.shopStats}>
          <span><img src="/icons/lightning.png" alt="" width={16} height={16} style={{ verticalAlign: 'middle', marginRight: 4 }} />{state.xp} XP available</span>
        </div>

        <div className={styles.shopSectionLabel}>Streak</div>
        <div className={styles.shopItem}>
          <div className={styles.shopItemInfo}>
            <span className={styles.shopItemIcon}><img src="/icons/shield.png" alt="" width={26} height={26} /></span>
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
          const { owned, canAfford } = packView(state, pack)
          return (
            <div key={pack.id} className={`${styles.shopItem} ${owned ? styles.shopItemOwned : ''}`}>
              <div className={styles.shopItemInfo}>
                <span className={styles.shopItemIcon} aria-hidden="true">{pack.icon}</span>
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

// Eased count-up so the number rolls to its new value instead of snapping.
// Starts already on `target`, so a fresh mount (or hard reload after hydration)
// shows the real total with no distracting count-from-zero.
function useCountUp(target, duration = 650) {
  const [display, setDisplay] = useState(target)
  const fromRef = useRef(target)
  const rafRef = useRef(0)
  useEffect(() => {
    const from = fromRef.current
    if (from === target) return
    const start = performance.now()
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(Math.round(from + (target - from) * eased))
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
      else fromRef.current = target
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [target, duration])
  return display
}

function XpCounter({ xp }) {
  const display = useCountUp(xp)
  const [delta, setDelta] = useState(null)
  const prevRef = useRef(xp)
  useEffect(() => {
    if (xp > prevRef.current) {
      // Keyed by value so React remounts the badge and the float animation
      // replays even on back-to-back gains.
      setDelta({ amount: xp - prevRef.current, key: Date.now() })
      const t = setTimeout(() => setDelta(null), 1200)
      prevRef.current = xp
      return () => clearTimeout(t)
    }
    prevRef.current = xp
  }, [xp])
  return (
    <div className={styles.xp}>
      <span className={styles.xpIcon}><img src="/icons/lightning.png" alt="" width={24} height={24} /></span>
      <span className={styles.xpNum}>{display} XP</span>
      {delta && <span key={delta.key} className={styles.xpDelta}>+{delta.amount}</span>}
    </div>
  )
}

export default function HomePage() {
  const {
    state, hydrated, isLessonComplete, isLessonUnlocked, levelProgress,
    buyStreakFreeze, STREAK_FREEZE_COST_XP, unlockPack, claimQuest, claimFriendQuest,
    setDailyGoal, markStreakMilestone,
  } = useProgress()
  const { user } = useAuth()
  const router = useRouter()
  const [showShop, setShowShop] = useState(false)
  const [showQuests, setShowQuests] = useState(false)
  const [showStreak, setShowStreak] = useState(false)

  if (!hydrated) return <LoadingBear />

  const resume = findResumeLesson(isLessonComplete, isLessonUnlocked)
  const streakAtRisk = state.streak > 0 && state.lastActiveDay !== new Date().toDateString()
  const claimable = claimableQuestCount(state.quests)
  const mistakeCount = Object.keys(state.wrongExercises || {}).length
  const milestone = pendingMilestone(state)

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
        <QuestsModal
          quests={state.quests}
          claimQuest={claimQuest}
          user={user}
          friendQuestClaimed={state.friendQuestClaimed}
          claimFriendQuest={claimFriendQuest}
          onClose={() => setShowQuests(false)}
        />
      )}
      {showStreak && (
        <StreakModal state={state} onClose={() => setShowStreak(false)} />
      )}
      {milestone && <StreakMilestone days={milestone} onClose={() => markStreakMilestone(milestone)} />}

      {/* ── Header ── */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.logo}>
            <img src="/icons/bulgarian_flag.png" alt="" className={styles.logoFlag} width={34} height={34} />
            <span className={styles.logoName}>
              Learn Bulgarian
              <sup className={styles.betaBadge}>Beta</sup>
            </span>
          </div>
          <div className={styles.headerStats}>
            <button className={`${styles.streak} ${styles.statBtn} ${streakAtRisk ? styles.streakAtRisk : ''}`} onClick={() => setShowStreak(true)} title="Streak calendar" aria-label={`${state.streak} day streak, open calendar`}>
              <span className={styles.streakFlame}><img src="/icons/fire.png" alt="" width={26} height={26} /></span>
              <span className={styles.streakNum}>{state.streak}</span>
            </button>
            <XpCounter xp={state.xp} />
            <button className={styles.shopBtn} onClick={() => setShowQuests(true)} title="Daily quests" aria-label={claimable ? `Daily quests, ${claimable} ready to claim` : 'Daily quests'}>
              <img src="/icons/another_star.png" alt="" width={26} height={26} />
              <span className={styles.iconLabel}>Quests</span>
              {claimable > 0 && <span className={styles.questBadge}>{claimable}</span>}
            </button>
            <button className={styles.shopBtn} onClick={() => setShowShop(true)} title="Shop" aria-label="Shop">
              <img src="/icons/gift_box.png" alt="" width={28} height={28} />
              <span className={styles.iconLabel}>Shop</span>
            </button>
            <Link href="/leaderboard" className={`${styles.shopBtn} ${styles.leaderboardLink}`} title="Leaderboard" aria-label="Leaderboard">
              <img src="/icons/trophy.png" alt="" width={26} height={26} />
              <span className={styles.iconLabel}>Ranks</span>
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

      <main className={styles.main}>
        <DailyGoal state={state} setDailyGoal={setDailyGoal} />
        {resume && (
          <ResumeCard
            resume={resume}
            isNew={!Object.keys(state.lessons || {}).length}
            streak={state.streak}
            streakAtRisk={streakAtRisk}
            mistakeCount={mistakeCount}
            onStart={() => {
              unlockAudio()
              router.push(`/lesson/${resume.lesson.id}?level=${resume.levelId}`)
            }}
          />
        )}
        {!resume && <PracticeLink count={mistakeCount} />}
        <PracticeLinks />
        <TopicTree levels={COURSE.levels} levelProgress={levelProgress} resumeLevelId={resume?.levelId} />

        <section className={styles.levelSection}>
          <div className={styles.levelDivider}>
            <div className={styles.dividerLine} />
            <span className={styles.dividerLabel}>Certificates</span>
            <div className={styles.dividerLine} />
          </div>
          <Certificates lessons={state.lessons} user={user} />
        </section>

        {/* ── Special Packs ── */}
        <section className={styles.levelSection}>
          <div className={styles.levelDivider}>
            <div className={styles.dividerLine} />
            <span className={styles.dividerLabel}>Special Packs</span>
            <div className={styles.dividerLine} />
          </div>
          <div className={styles.packsGrid}>
            {SPECIAL_PACKS.map(pack => {
              const { owned, canAfford } = packView(state, pack)
              return (
                <div key={pack.id} className={`${styles.packCard} ${owned ? styles.packOwned : ''}`}>
                  <div className={styles.packCardIcon} aria-hidden="true">{pack.icon}</div>
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

    </div>
  )
}
