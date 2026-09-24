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
        <TopicTree
          levels={LEVELS}
          levelProgress={levelProgress}
          resumeLevelId={resume?.level.id}
          lockOf={lockOf}
          onUnlock={setUnlocking}
        />

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
