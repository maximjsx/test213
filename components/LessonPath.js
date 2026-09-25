'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { hapticTap, unlockAudio } from '../lib/audio'
import Bear from './Bear'
import styles from './LessonPath.module.css'

// Zig-zag layout of the lesson nodes down the map. Hoisted so it isn't
// re-allocated for every lesson on every render.
const NODE_POSITIONS = ['center', 'right', 'center', 'left', 'center', 'right', 'center', 'left']

function LessonNode({ lesson, levelLessons, idx, levelColor, isComplete, isUnlocked, isResume, justCompleted, levelId, isLast, levelIndex, pos }) {
  const [showTooltip, setShowTooltip] = useState(false)
  const [pressed, setPressed] = useState(false)
  const nodeRef = useRef(null)
  const tooltipRef = useRef(null)
  const router = useRouter()

  useEffect(() => {
    if (!showTooltip) return
    // If the popup is clipped, nudge the page down to reveal the whole thing
    // (including the START button). On mobile the fixed bottom nav bar covers
    // the lower screen, so clear its top edge rather than the viewport bottom.
    const t = tooltipRef.current
    if (t) {
      const navRect = document.querySelector('nav')?.getBoundingClientRect()
      const bottomLimit = navRect && navRect.height > 0 ? navRect.top : window.innerHeight
      const overflow = t.getBoundingClientRect().bottom - (bottomLimit - 16)
      if (overflow > 0) window.scrollBy({ top: overflow, behavior: 'smooth' })
    }
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
      {/* START label + mascot mark only the single "resume" node (where you
          left off), not every startable level entry, so the map stays calm. */}
      {isResume && (
        <div className={`${styles.startLabel} ${showTooltip ? styles.startLabelHide : ''}`}>START</div>
      )}
      {isResume && (
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
        } ${pressed ? styles.nodePressed : ''} ${justCompleted ? styles.nodeJustDone : ''}`}
        style={isComplete ? { background: levelColor, borderColor: levelColor, boxShadow: `0 4px 0 color-mix(in srgb, ${levelColor} 60%, #000)` }
          : isCurrent ? { borderColor: levelColor, boxShadow: `0 4px 0 var(--border-hi)` } : {}}
        onClick={handleToggle}
        onPointerDown={handlePress}
        onPointerUp={handleRelease}
        onPointerLeave={handleRelease}
        onPointerCancel={handleRelease}
        aria-label={`${displayTitle}${isComplete ? ', completed' : !isUnlocked ? ', locked' : ''}`}
        aria-expanded={showTooltip}
      >
        {isComplete ? <span className={styles.nodeCheck}><img src="/icons/green_checkmark.png" alt="" width={44} height={44} /></span>
          : !isUnlocked ? <span className={styles.lockIcon}><img src="/icons/lock.png" alt="" width={36} height={36} /></span>
          : <span className={styles.nodeNum}>{lessonNum}</span>}
      </button>

      {showTooltip && (
        isUnlocked ? (
          <div className={styles.tooltip} ref={tooltipRef}>
            <div className={styles.tooltipTitle}>{displayTitle}</div>
            <div className={styles.tooltipSub}>Lesson {lessonNum} of {totalInLevel}</div>
            <button
              className={styles.tooltipBtn}
              style={{ background: levelColor }}
              onClick={(e) => {
                // Navigate programmatically. Using a <Link> here meant its own
                // onClick unmounted the anchor (setShowTooltip(false)) mid-click,
                // which sometimes cancelled the navigation and left the browser
                // to fall back to a scroll — "pressed start, page just jumped".
                e.preventDefault()
                unlockAudio()
                router.push(`/lesson/${lesson.id}?level=${levelId}`)
              }}
            >
              {isComplete ? `PRACTICE +${Math.ceil(lesson.coins / 2)} COINS` : `START +${lesson.coins} COINS`}
            </button>
          </div>
        ) : (
          <div className={`${styles.tooltip} ${styles.tooltipLocked}`} ref={tooltipRef}>
            <div className={styles.tooltipTitle}>{displayTitle}</div>
            <div className={styles.tooltipSub}>Complete all lessons above to unlock this!</div>
            <div className={styles.tooltipBtnLocked}>LOCKED</div>
          </div>
        )
      )}
    </div>
  )
}

function segmentPath(a, b) {
  const midY = (a.y + b.y) / 2
  return `M${a.x},${a.y} C${a.x},${midY} ${b.x},${midY} ${b.x},${b.y}`
}

function LessonPathWithLines({ children, lessons, isLessonComplete, levelColor, justCompletedId }) {
  const containerRef = useRef(null)
  const svgRef = useRef(null)
  const drawnInRef = useRef(false)

  useEffect(() => {
    let frame = 0
    // Paths are updated in place rather than recreated, so a redraw (resize,
    // fonts, a progress update) never restarts the draw-in animation
    function draw() {
      const container = containerRef.current
      const svg = svgRef.current
      if (!container || !svg) return
      const cRect = container.getBoundingClientRect()
      const pts = Array.from(container.querySelectorAll('button[data-lesson-node]')).map(btn => {
        const r = btn.getBoundingClientRect()
        return { x: r.left + r.width / 2 - cRect.left, y: r.top + r.height / 2 - cRect.top }
      })
      const count = Math.max(0, pts.length - 1)
      while (svg.childNodes.length > count) svg.lastChild.remove()
      while (svg.childNodes.length < count) {
        const el = document.createElementNS('http://www.w3.org/2000/svg', 'path')
        el.setAttribute('fill', 'none')
        el.setAttribute('stroke-linecap', 'round')
        svg.appendChild(el)
      }
      for (let i = 0; i < count; i++) {
        const el = svg.childNodes[i]
        el.setAttribute('d', segmentPath(pts[i], pts[i + 1]))
        const bothDone = isLessonComplete(lessons[i].id) && isLessonComplete(lessons[i + 1].id)
        if (!bothDone) {
          el.setAttribute('stroke', 'var(--border-hi)')
          el.setAttribute('stroke-width', '3')
          el.setAttribute('stroke-dasharray', '6 7')
          el.setAttribute('opacity', '0.45')
          continue
        }
        el.setAttribute('stroke', levelColor)
        el.setAttribute('stroke-width', '5')
        el.setAttribute('opacity', '0.55')
        el.removeAttribute('stroke-dasharray')
        const touchesJustDone = justCompletedId && (lessons[i].id === justCompletedId || lessons[i + 1].id === justCompletedId)
        if (el.classList.contains(styles.lineDraw)) {
          el.style.strokeDasharray = String(el.getTotalLength())
        } else if (touchesJustDone && !drawnInRef.current) {
          const len = el.getTotalLength()
          el.style.strokeDasharray = String(len)
          el.style.strokeDashoffset = String(len)
          el.classList.add(styles.lineDraw)
        }
      }
      if (justCompletedId) drawnInRef.current = true
    }
    // Coalesce bursts of resize/reflow events into a single draw per frame.
    function recompute() {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(draw)
    }
    recompute()
    window.addEventListener('resize', recompute)
    // Also redraw when the container itself changes size (font load, images
    // decoding, lessons expanding); window resize alone misses those.
    const ro = new ResizeObserver(recompute)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', recompute)
      ro.disconnect()
    }
  }, [lessons, isLessonComplete, levelColor, justCompletedId])

  return (
    <div className={styles.lessonPath} ref={containerRef}>
      <svg ref={svgRef} style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:0, overflow:'visible' }} />
      {children}
    </div>
  )
}

// One topic's lessons as a zigzag path. `currentRef` lands on the first
// startable, unfinished lesson so the page can scroll to it.
export default function LessonPath({ level, levelIndex, isLessonComplete, isLessonUnlocked, justCompletedId, currentRef }) {
  const resumeIdx = level.lessons.findIndex((l, idx) => isLessonUnlocked(level.lessons, idx) && !isLessonComplete(l.id))
  return (
    <LessonPathWithLines lessons={level.lessons} isLessonComplete={isLessonComplete} levelColor={level.color} justCompletedId={justCompletedId}>
      {level.lessons.map((lesson, idx) => {
        const pos = NODE_POSITIONS[idx % NODE_POSITIONS.length]
        const isResume = idx === resumeIdx
        return (
          <div key={lesson.id} className={`${styles.pathStep} ${styles[`pos_${pos}`]}`} ref={isResume ? currentRef : null}>
            <LessonNode
              lesson={lesson}
              levelLessons={level.lessons}
              idx={idx}
              levelColor={level.color}
              isComplete={isLessonComplete(lesson.id)}
              isUnlocked={isLessonUnlocked(level.lessons, idx)}
              isResume={isResume}
              justCompleted={lesson.id === justCompletedId}
              levelId={level.id}
              isLast={idx === level.lessons.length - 1}
              levelIndex={levelIndex}
              pos={pos}
            />
          </div>
        )
      })}
    </LessonPathWithLines>
  )
}
