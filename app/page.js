'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LEVELS, findResumeLesson, lessonHref } from '../lib/course'
import { useProgress } from '../hooks/useProgress'
import { useAuth } from '../hooks/useAuth'
import { claimableQuestCount } from '../lib/quests'
import { pendingMilestone } from '../lib/goals'
import { unlockAudio } from '../lib/audio'
import HomeHeader from '../components/home/HomeHeader'
import ResumeCard, { PracticeMistakesLink } from '../components/home/ResumeCard'
import PracticeLinks from '../components/home/PracticeLinks'
import ShopModal from '../components/home/ShopModal'
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
    buyStreakFreeze, STREAK_FREEZE_COST_XP, claimQuest, claimFriendQuest,
    setDailyGoal, markStreakMilestone,
  } = useProgress()
  const { user } = useAuth()
  const router = useRouter()
  const [modal, setModal] = useState(null)
  const close = () => setModal(null)

  if (!hydrated) return <HomeSkeleton />

  const resume = findResumeLesson(isLessonComplete, isLessonUnlocked)
  const streakAtRisk = state.streak > 0 && state.lastActiveDay !== new Date().toDateString()
  const mistakeCount = Object.keys(state.wrongExercises || {}).length
  const milestone = pendingMilestone(state)

  return (
    <div className={styles.page}>
      {modal === 'shop' && (
        <ShopModal state={state} freezeCost={STREAK_FREEZE_COST_XP} onBuyFreeze={buyStreakFreeze} onClose={close} />
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
      {modal === 'streak' && <StreakModal state={state} onClose={close} />}
      {milestone && <StreakMilestone days={milestone} onClose={() => markStreakMilestone(milestone)} />}

      <HomeHeader
        state={state}
        user={user}
        streakAtRisk={streakAtRisk}
        claimable={claimableQuestCount(state.quests)}
        onOpenStreak={() => setModal('streak')}
        onOpenQuests={() => setModal('quests')}
        onOpenShop={() => setModal('shop')}
      />

      <main className={styles.main}>
        <DailyGoal state={state} setDailyGoal={setDailyGoal} />
        {resume ? (
          <ResumeCard
            resume={resume}
            isNew={!Object.keys(state.lessons || {}).length}
            streak={state.streak}
            streakAtRisk={streakAtRisk}
            mistakeCount={mistakeCount}
            onStart={() => {
              unlockAudio()
              router.push(lessonHref(resume.lesson, resume.level))
            }}
          />
        ) : (
          <PracticeMistakesLink count={mistakeCount} />
        )}
        <PracticeLinks />
        <TopicTree levels={LEVELS} levelProgress={levelProgress} resumeLevelId={resume?.level.id} />

        <section className={styles.levelSection}>
          <div className={styles.levelDivider}>
            <div className={styles.dividerLine} />
            <h2 className={styles.dividerLabel}>Certificates</h2>
            <div className={styles.dividerLine} />
          </div>
          <Certificates lessons={state.lessons} user={user} />
        </section>
      </main>
    </div>
  )
}
