'use client'
import { useState } from 'react'
import { TYPING_DURATIONS, TYPING_SOURCES, typingBoard } from '../../lib/typingBoards'
import Button from '../ui/Button'
import Segmented from './Segmented'
import TypingLeaderboard from './TypingLeaderboard'
import styles from './TypingTest.module.css'

// The typing boards on the leaderboard page, with the same length and text
// switches as the test itself
export default function TypingRanks() {
  const [duration, setDuration] = useState(30)
  const [source, setSource] = useState('words')
  return (
    <div className={styles.test}>
      <div className={styles.toolbar}>
        <Segmented label="Length" options={TYPING_DURATIONS.map(d => ({ id: d, label: `${d}s` }))} value={duration} onChange={setDuration} />
        <Segmented label="Text" options={TYPING_SOURCES} value={source} onChange={setSource} />
      </div>
      <TypingLeaderboard board={typingBoard(duration, source)} title="Fastest typists" />
      <Button href="/practice/typing" variant="secondary" block>Take the typing test</Button>
    </div>
  )
}
