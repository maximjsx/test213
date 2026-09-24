'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LEVELS, findLevel, findResumeLesson, lessonHref } from '../lib/course'
import { useProgress } from '../hooks/useProgress'
import { useAuth } from '../hooks/useAuth'
import { claimableQuestCount } from '../lib/quests'
import { pendingMilestone } from '../lib/goals'
import { unlockAudio } from '../lib/audio'
import HomeHeader from '../components/home/HomeHeader'
import HomeStats from '../components/home/HomeStats'
import ReviewCta from '../components/decks/ReviewCta'
import { useDecks } from '../hooks/useDecks'
import ResumeCard, { PracticeMistakesLink } from '../components/home/ResumeCard'
import PracticeLinks from '../components/home/PracticeLinks'
import ShopModal from '../components/home/ShopModal'
import UnlockTopicModal from '../components/home/UnlockTopicModal'
import QuestsModal from '../components/QuestsModal'
import StreakModal from '../components/StreakModal'
import StreakMilestone from '../components/StreakMilestone'
import TopicTree from '../components/TopicTree'
import Certificates from '../components/Certificates'
import DailyGoal from '../components/DailyGoal'
import { HomeSkeleton } from '../components/PageSkeletons'
import styles from '../components/home/Home.module.css'

export default function HomePage() {
  const {
    state, hydrated, isLessonComplete, isLessonUnlocked, levelProgress,
    buyStreakFreeze, STREAK_FREEZE_COST, claimQuest, claimFriendQuest,
    setDailyGoal, markStreakMilestone, unlockTopic, isTopicUnlocked, lockOf,
  } = useProgress()
  const { user, refresh: refreshAuth } = useAuth()
  const { dueCount } = useDecks()
  const router = useRouter()
  const [modal, setModal] = useState(null)
  const [unlocking, setUnlocking] = useState(null)
  const close = () => setModal(null)

  // Opening a locked special topic from a link lands here with ?unlock=<id>
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('unlock')
    const level = id && findLevel(id)
    if (level?.special) setUnlocking(level)
    if (id) router.replace('/', { scroll: false })
  }, [router])

  if (!hydrated) return <HomeSkeleton />

  const resume = findResumeLesson(isLessonComplete, isLessonUnlocked, isTopicUnlocked)
  const streakAtRisk = state.streak > 0 && state.lastActiveDay !== new Date().toDateString()
  const mistakeCount = Object.keys(state.wrongExercises || {}).length
  const milestone = pendingMilestone(state)
  const stats = {
    state,
    streakAtRisk,
    claimable: claimableQuestCount(state.quests),
    onOpenStreak: () => setModal('streak'),
    onOpenQuests: () => setModal('quests'),
    onOpenShop: () => setModal('shop'),
  }

  return (
    <div className={styles.page}>
      {modal === 'shop' && (
        <ShopModal state={state} freezeCost={STREAK_FREEZE_COST} onBuyFreeze={buyStreakFreeze} onClose={close} />
      )}
      {modal === 'quests' && (
        <QuestsModal
          quests={state.quests}
          claimQuest={claimQuest}
          user={user}
          friendQuestClaimed={state.friendQuestClaimed}
          claimFriendQuest={claimFriendQuest}
          onClose={close}
        />
      )}
      {unlocking && lockOf(unlocking) && (
        <UnlockTopicModal
          level={unlocking}
          lock={lockOf(unlocking)}
          coins={state.coins}
          user={user}
          onUnlock={unlockTopic}
          onCheckGuild={async () => {
            const fresh = await refreshAuth({ sync: true })
            return !!fresh?.guildIds?.includes(unlocking.special.guild.id)
          }}
          onClose={() => setUnlocking(null)}
        />
      )}
      {modal === 'streak' && <StreakModal state={state} onClose={close} />}
      {milestone && <StreakMilestone days={milestone} onClose={() => markStreakMilestone(milestone)} />}

      <HomeHeader {...stats} />

      <div className={styles.layout}>
        <main className={styles.primary}>
          {resume && (
            <ResumeCard
              className={styles.oResume}
              resume={resume}
              isNew={!Object.keys(state.lessons || {}).length}
              streak={state.streak}
              streakAtRisk={streakAtRisk}
              onStart={() => {
                unlockAudio()
                router.push(lessonHref(resume.lesson, resume.level))
              }}
            />
          )}
          <div className={styles.oTree}>
            <h1 className="sr-only">Your Bulgarian course</h1>
            <TopicTree
              levels={LEVELS}
              levelProgress={levelProgress}
              resumeLevelId={resume?.level.id}
              lockOf={lockOf}
              onUnlock={setUnlocking}
            />
          </div>
          <section className={styles.oCerts} aria-labelledby="certs-title">
            <div className={styles.sectionHead}>
              <div className={styles.sectionLine} />
              <h2 id="certs-title" className={styles.sectionLabel}>Certificates</h2>
              <div className={styles.sectionLine} />
            </div>
            <Certificates lessons={state.lessons} user={user} />
          </section>
        </main>

        <aside className={styles.aside} aria-label="Your day">
          <HomeStats {...stats} className={styles.asideStats} />
          <DailyGoal className={styles.oGoal} state={state} setDailyGoal={setDailyGoal} />
          <ReviewCta className={styles.oReview} count={dueCount} />
          <PracticeMistakesLink className={styles.oMistakes} count={mistakeCount} />
          <PracticeLinks className={styles.oTiles} />
        </aside>
      </div>
    </div>
  )
}
