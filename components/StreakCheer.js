'use client'
import { useEffect, useState } from 'react'
import BearBody, { GROUND, CENTER } from './BearBody'
import { CHEER_SCENES, TRAPEZE, poseAt } from './bearScenes'
import { playStreak, hapticCorrect } from '../lib/audio'
import styles from './StreakCheer.module.css'

const SPARKS = 10

// 5, 10, 20, 30 and on: early enough to feel it, rare enough to stay special
export function isCheerStreak(count) {
  return count === 5 || (count >= 10 && count % 10 === 0)
}

// Each tier alternates between its two scenes, starting from a random one
const lastVariant = {}

function pickScene(count) {
  const tier = count < 10 ? 0 : (count / 10) % CHEER_SCENES.length
  const options = CHEER_SCENES[tier]
  const previous = lastVariant[tier]
  const next = previous === undefined ? Math.floor(Math.random() * options.length) : (previous + 1) % options.length
  lastVariant[tier] = next
  return options[next]
}

// Damped spring the head rides on, so it lags behind sudden drops and stops
function makeLag(stiffness, damping) {
  let offset = 0
  let speed = 0
  return (push, dt) => {
    speed += (push - stiffness * offset - damping * speed) * dt
    offset += speed * dt
    return offset
  }
}

const clamp = (v, limit) => Math.max(-limit, Math.min(limit, v))

function useScenePose(scene) {
  const [pose, setPose] = useState(() => poseAt(scene, 0))

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setPose(poseAt(scene, scene.duration))
      return
    }
    const lagY = makeLag(300, 18)
    const lagX = makeLag(300, 18)
    let start, last, prev, frame
    let vx = 0
    let vy = 0

    function tick(now) {
      start ??= now
      const dt = Math.min((now - (last ?? now)) / 1000, 1 / 30)
      last = now
      const next = poseAt(scene, (now - start) / 1000)
      if (prev && dt > 0) {
        const nvx = (next.x - prev.x) / dt
        const nvy = (next.y - prev.y) / dt
        next.headY += clamp(lagY(-(nvy - vy) / dt * 0.25, dt), 8)
        next.head += clamp(lagX(-(nvx - vx) / dt * 0.4, dt), 12)
        vx = nvx
        vy = nvy
      }
      prev = next
      setPose(next)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [scene])

  return pose
}

export default function StreakCheer({ count }) {
  const [scene] = useState(() => pickScene(count))
  const pose = useScenePose(scene)

  useEffect(() => {
    playStreak()
    hapticCorrect()
  }, [])

  return (
    <div className={styles.wrap}>
      <div className={styles.stage} style={{ '--burst': `${scene.burst}s` }}>
        <span className={styles.ring} />
        <span className={`${styles.ring} ${styles.ringLate}`} />
        {Array.from({ length: SPARKS }, (_, i) => (
          <span key={i} className={styles.spark} style={{ '--angle': `${(360 / SPARKS) * i}deg`, '--delay': `${(i % 3) * 60}ms` }} />
        ))}
        <svg className={styles.scene} viewBox="0 0 240 260" overflow="visible" aria-hidden="true">
          {scene.prop === 'trapeze' && <Trapeze rot={pose.rot} />}
          {scene.prop === 'dust' && <Dust t={pose.t} />}
          <BearBody
            pose={pose}
            pivot={scene.pivot}
            armsOverHead={scene.armsOverHead}
            pawL={scene.prop === 'bowl' && <Berry color="#d23c5a" opacity={pose.berryL} />}
            pawR={scene.prop === 'bowl' ? <Berry color="#4b6fd6" opacity={pose.berryR} /> : scene.prop === 'balloon' && <Balloon />}
          />
          {scene.prop === 'bowl' && <Bowl y={pose.bowl} />}
        </svg>
      </div>
      <div className={styles.count}>
        <img src="/icons/fire.png" alt="" width={34} height={34} />
        <span>{count}</span>
      </div>
      <h2 className={styles.title}>{count} in a row!</h2>
      <p className={styles.line}>{scene.line}</p>
    </div>
  )
}

// Ropes meet at the anchor, so the bar swings in step with the bear's grip
function Trapeze({ rot }) {
  const bar = GROUND + TRAPEZE.y - TRAPEZE.gripAt
  return (
    <g className={styles.trapeze} transform={`rotate(${rot} ${CENTER} ${TRAPEZE.anchor})`} fill="none" strokeLinecap="round">
      <path d={`M${CENTER - 46} ${bar} L${CENTER} ${TRAPEZE.anchor} L${CENTER + 46} ${bar}`} strokeWidth="4" strokeLinejoin="round" />
      <path d={`M${CENTER - 50} ${bar} L${CENTER + 50} ${bar}`} strokeWidth="8" />
    </g>
  )
}

// Puffs kicked up behind the feet as the bear skids to a stop
function Dust({ t }) {
  return [0, 1, 2, 3].map(i => {
    const p = (t - 0.9 - i * 0.05) / 0.6
    if (p < 0 || p > 1) return null
    return <circle key={i} className={styles.dust} cx={90 - i * 14 - 24 * p} cy={GROUND - 4 - 14 * p} r={5 + 9 * p} opacity={0.5 * (1 - p)} />
  })
}

function Berry({ color, opacity }) {
  return (
    <g opacity={opacity}>
      <circle cx="0" cy="37" r="6.5" fill={color} />
      <circle cx="-2" cy="35" r="1.8" fill="#ffffff" opacity="0.5" />
    </g>
  )
}

// Held in the paw, so with the arm raised it floats above the shoulder
function Balloon() {
  return (
    <g>
      <path d="M0 34 Q4 52 0 70" stroke="#d9d9d9" strokeWidth="1.5" fill="none" />
      <path d="M-3 73 L3 73 L0 68 Z" fill="#c9304f" />
      <ellipse cx="0" cy="96" rx="20" ry="24" fill="#ef476f" />
      <ellipse cx="-7" cy="104" rx="5" ry="8" fill="#ffffff" opacity="0.3" />
    </g>
  )
}

// Sits in the lap; drawn over the arms so the paws dip into it
function Bowl({ y }) {
  const rim = GROUND - 32 + y
  return (
    <g>
      <circle cx="106" cy={rim - 3} r="6" fill="#d23c5a" />
      <circle cx="119" cy={rim - 6} r="6" fill="#4b6fd6" />
      <circle cx="132" cy={rim - 3} r="6" fill="#d23c5a" />
      <path d={`M84 ${rim} Q120 ${rim + 38} 156 ${rim} Z`} fill="#8a5a30" />
      <ellipse cx="120" cy={rim} rx="36" ry="5" fill="#6e4524" />
    </g>
  )
}
