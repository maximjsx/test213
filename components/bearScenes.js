// Streak cheer choreography. A scene keyframes the bear's pose for an intro,
// then hands over to an endless loop whose offsets start at zero, so the
// hand-off never snaps. Distances are stage pixels, angles are degrees, and
// arms and legs count positive outward so one number reads the same on both sides.

export const REST = {
  x: 0, y: 0, rot: 0, sx: 1, sy: 1,
  armL: 20, armR: 20, legL: 0, legR: 0, kneeL: 1, kneeR: 1,
  head: 0, headY: 0, chew: 0, berryL: 0, berryR: 0, bowl: 0,
}

const EASE = {
  linear: t => t,
  in: t => t * t,
  out: t => 1 - (1 - t) * (1 - t),
  inOut: t => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2),
  back: t => 1 + 2.70158 * (t - 1) ** 3 + 1.70158 * (t - 1) ** 2,
}

const TAU = Math.PI * 2

function smooth(from, to, t) {
  const k = Math.min(Math.max((t - from) / (to - from), 0), 1)
  return k * k * (3 - 2 * k)
}

// Keys are [time, { prop: value | [value, ease] }, ease]. Each prop becomes its
// own track, so a key only names what changes and the rest keeps moving.
function compile(keys) {
  const tracks = {}
  for (const [t, values, ease = 'inOut'] of keys) {
    for (const [prop, raw] of Object.entries(values)) {
      const [v, e] = Array.isArray(raw) ? raw : [raw, ease]
      tracks[prop] ||= [{ t: 0, v: REST[prop] }]
      if (t === 0) tracks[prop][0].v = v
      else tracks[prop].push({ t, v, ease: e })
    }
  }
  return tracks
}

function valueAt(track, t) {
  const next = track.findIndex(k => k.t > t)
  if (next === -1) return track[track.length - 1].v
  const a = track[next - 1]
  const b = track[next]
  return a.v + (b.v - a.v) * EASE[b.ease]((t - a.t) / (b.t - a.t))
}

function scene({ keys, ...rest }) {
  return { pivot: 54, ...rest, tracks: compile(keys), duration: Math.max(...keys.map(k => k[0])) }
}

export function poseAt(scene, t) {
  const pose = { ...REST, t, mouth: scene.mouth?.(t) || 'smile' }
  for (const [prop, track] of Object.entries(scene.tracks)) pose[prop] = valueAt(track, t)
  scene.motion?.(pose, t)
  if (t > scene.duration) scene.loop?.(pose, t - scene.duration)
  return pose
}

// The usual finish: both arms up and waving, head bobbing to the beat
function wave(pose, u, arms = ['armL', 'armR']) {
  const e = smooth(0, 0.4, u)
  const s = Math.sin(u * TAU * 1.3)
  if (arms.includes('armL')) pose.armL += 16 * s * e
  if (arms.includes('armR')) pose.armR -= 16 * s * e
  pose.head += 6 * s * e
  pose.y -= 5 * s * s * e
}

const backflip = scene({
  line: 'You are on fire. Keep it going!',
  burst: 1.15,
  mouth: t => (t > 0.45 && t < 1.15 ? 'o' : 'smile'),
  keys: [
    [0.3, { y: 0, sy: 0.8, sx: 1.12, armL: -5, armR: -5 }],
    [0.45, { y: [-10, 'out'], rot: 0, sy: 1.1, sx: 0.92, armL: 165, armR: 165, legL: 0, legR: 0, kneeL: 1, kneeR: 1 }],
    [0.8, { y: [-75, 'out'], sy: 1, sx: 1, armL: 165, armR: 165, legL: 25, legR: 25, kneeL: 0.6, kneeR: 0.6 }],
    [1.15, { y: [0, 'in'], rot: -360, sy: 1, sx: 1, armL: 140, armR: 140, legL: 0, legR: 0, kneeL: 1, kneeR: 1 }],
    [1.3, { sy: 0.8, sx: 1.15, armL: 120, armR: 120 }],
    [1.6, { sy: [1, 'back'], sx: [1, 'back'], armL: 150, armR: 150 }],
  ],
  loop: wave,
})

const starJump = scene({
  line: 'Look at you go!',
  burst: 1.7,
  keys: [
    [0.2, { y: 0, sy: 0.85, sx: 1.1, armL: 5, armR: 5, legL: 0, legR: 0 }],
    [0.55, { y: [-60, 'out'], sy: 1.05, sx: 0.95, armL: 165, armR: 165, legL: 32, legR: 32 }],
    [0.9, { y: [0, 'in'], sy: 1, sx: 1, armL: 30, armR: 30, legL: 0, legR: 0 }],
    [1.0, { y: 0, sy: 0.85, sx: 1.1, armL: 10, armR: 10, legL: 0, legR: 0 }],
    [1.35, { y: [-70, 'out'], sy: 1.05, sx: 0.95, armL: 170, armR: 170, legL: 35, legR: 35 }],
    [1.7, { y: [0, 'in'], sy: 1, sx: 1, armL: 140, armR: 140, legL: 0, legR: 0 }],
    [1.8, { sy: 0.82, sx: 1.14 }],
    [2.05, { sy: [1, 'back'], sx: [1, 'back'], armL: 150, armR: 150 }],
  ],
  loop: wave,
})

const dashIn = scene({
  line: 'Nothing can stop you now.',
  burst: 1.0,
  pivot: 30,
  prop: 'dust',
  keys: [
    [0, { x: -330, rot: 12 }],
    [0.8, { x: [-40, 'linear'], rot: 12, armL: 20, armR: 20 }],
    [1.05, { x: [12, 'out'], rot: -10, armL: 20, armR: 20 }],
    [1.3, { x: 0, rot: 0 }],
    [1.5, { armL: 150, armR: 150 }],
  ],
  // Running stride on top of the dash: knees lift in turn, arms pump against them
  motion(pose, t) {
    const e = 1 - smooth(0.75, 1.0, t)
    const s = Math.sin(t * TAU * 3.2)
    pose.legL += (10 + 25 * s) * e
    pose.legR += (-10 + 25 * s) * e
    pose.kneeL -= 0.35 * Math.max(0, s) * e
    pose.kneeR -= 0.35 * Math.max(0, -s) * e
    pose.armL += 45 * Math.max(0, -s) * e
    pose.armR += 45 * Math.max(0, s) * e
    pose.y -= 7 * Math.abs(s) * e
  },
  loop: wave,
})

const cartwheel = scene({
  line: 'Head over heels for Bulgarian.',
  burst: 1.3,
  keys: [
    [0, { x: 330, y: -12, armL: 170, armR: 170, legL: 35, legR: 35 }],
    [1.2, { x: [0, 'out'], y: -12, rot: [-720, 'out'], armL: 170, armR: 170, legL: 35, legR: 35 }],
    [1.35, { y: [0, 'in'], sy: 0.85, sx: 1.12, armL: 140, armR: 140, legL: 0, legR: 0 }],
    [1.6, { sy: [1, 'back'], sx: [1, 'back'], armL: 150, armR: 150 }],
  ],
  loop: wave,
})

// A trapeze hung from one point above the stage: bear and bar swing together
// around it like a pendulum, fastest at the bottom of each swing.
export const TRAPEZE = { y: -30, anchor: -40, gripAt: 94 }
const trapeze = scene({
  line: 'Hanging in there like a pro.',
  burst: 0.35,
  pivot: 252 + TRAPEZE.y - TRAPEZE.anchor,
  prop: 'trapeze',
  mouth: t => (t < 0.5 ? 'o' : 'smile'),
  keys: [
    [0, { y: TRAPEZE.y, rot: 75, armL: 152, armR: 152, legL: 30, legR: -10 }],
    [0.7, { rot: -28, legL: -8, legR: 26 }],
    [1.3, { rot: 18, legL: 20, legR: -4 }],
    [1.85, { rot: -10, legL: 2, legR: 14 }],
    [2.35, { rot: 5 }],
    [2.8, { rot: 0, legL: 8, legR: 8 }],
  ],
  loop(pose, u) {
    const e = smooth(0, 0.4, u)
    const s = Math.sin(u * TAU * 1.5)
    pose.legL += 22 * s * e
    pose.legR -= 22 * s * e
    pose.rot += 2.5 * Math.sin(u * TAU * 0.5) * e
    pose.head += 5 * s * e
  },
})

const balloon = scene({
  line: 'Floating on a perfect streak.',
  burst: 2.0,
  prop: 'balloon',
  keys: [
    [0, { x: -30, y: -300, rot: 6, armL: 40, armR: 150, legL: 8, legR: 8 }],
    [2.0, { x: 0, y: [0, 'out'], rot: 0, armL: 40, legL: 0, legR: 0 }],
    [2.15, { sy: 0.9, sx: 1.08 }],
    [2.4, { sy: [1, 'back'], sx: [1, 'back'], armL: 150 }],
  ],
  // Drifts down swaying, legs dangling, and settles just before touchdown
  motion(pose, t) {
    const e = 1 - smooth(1.4, 2.0, t)
    pose.rot += 9 * Math.sin(t * TAU * 0.6) * e
    pose.legL += 12 * Math.sin(t * TAU * 0.9) * e
    pose.legR -= 12 * Math.sin(t * TAU * 0.9) * e
  },
  loop: (pose, u) => wave(pose, u, ['armL']),
})

const berrySnack = scene({
  line: 'A berry break, well earned.',
  burst: 0.6,
  prop: 'bowl',
  armsOverHead: true,
  mouth: t => (t > 0.85 ? 'chew' : 'smile'),
  keys: [
    [0, { bowl: -280 }],
    [0.3, { y: [-30, 'out'], sy: 1.05, sx: 0.97 }],
    [0.55, { y: [11, 'in'], legL: 55, legR: 55, kneeL: 0.85, kneeR: 0.85, sy: 1, sx: 1 }],
    [0.6, { bowl: [0, 'in'] }],
    [0.65, { sy: 0.88, sx: 1.1 }],
    [0.85, { sy: [1, 'back'], sx: [1, 'back'], armL: -25, armR: -25, berryL: 1, berryR: 1 }],
  ],
  // Paws take turns: grab from the bowl, up to the mouth, the berry is gone
  loop(pose, u) {
    const feed = (arm, berry, offset) => {
      const p = (u / 1.4 + offset) % 1
      pose[arm] -= 113 * (p < 0.5 ? Math.sin((Math.PI * p) / 0.5) ** 2 : 0)
      pose[berry] = p < 0.25 || p > 0.5 ? 1 : 0
    }
    feed('armL', 'berryL', 0)
    feed('armR', 'berryR', 0.5)
    pose.chew = 0.35 + 0.65 * Math.abs(Math.sin(u * TAU * 2.5))
    pose.head += 4 * Math.sin(u * TAU * 0.7) * smooth(0, 0.4, u)
  },
})

const dance = scene({
  line: 'This streak deserves a dance.',
  burst: 0.85,
  keys: [
    [0.15, { y: 0, sy: 0.88, sx: 1.08, armL: 10, armR: 10 }],
    [0.35, { y: [-35, 'out'], sy: 1.05, sx: -1, armL: 110, armR: 110 }],
    [0.55, { sx: 1 }],
    [0.75, { y: [0, 'in'], sy: 1, sx: -1 }],
    [0.9, { sy: 0.86, sx: 1.12 }],
    [1.15, { sy: [1, 'back'], sx: [1, 'back'], armL: 150, armR: 40 }],
  ],
  // Disco: hips sway, one paw points up while the other drops, then they swap
  loop(pose, u) {
    const e = smooth(0, 0.3, u)
    const beat = u * TAU * 1.1
    const s = Math.sin(beat)
    pose.armL = 95 + 55 * Math.cos(beat)
    pose.armR = 95 - 55 * Math.cos(beat)
    pose.x += 10 * s * e
    pose.rot += 7 * s * e
    pose.kneeL -= 0.25 * Math.max(0, s) * e
    pose.kneeR -= 0.25 * Math.max(0, -s) * e
    pose.head -= 8 * s * e
    pose.y -= 6 * Math.abs(s) * e
  },
})

// One pair per milestone tier: 5, then 10, 20, 30, and around again
export const CHEER_SCENES = [
  [backflip, starJump],
  [dashIn, cartwheel],
  [trapeze, balloon],
  [berrySnack, dance],
]
