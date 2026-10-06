// Full-body mascot for the streak scenes, drawn from a pose (see bearScenes.js).
// Renders an SVG group standing on the stage ground; each limb rotates at its
// shoulder or hip, and knees bend by squashing the leg toward the hip.
export const GROUND = 252
export const CENTER = 120
const SCALE = 0.9

export default function BearBody({ pose, pivot, armsOverHead, pawL, pawR }) {
  const arms = (
    <>
      <Limb at="52 114" angle={pose.armL}><Arm>{pawL}</Arm></Limb>
      <Limb at="108 114" angle={-pose.armR}><Arm>{pawR}</Arm></Limb>
    </>
  )
  return (
    <g transform={`translate(${CENTER + pose.x} ${GROUND + pose.y}) rotate(${pose.rot} 0 ${-pivot}) scale(${pose.sx * SCALE} ${pose.sy * SCALE}) translate(-80 -190)`}>
      <Limb at="66 162" angle={pose.legL} stretch={pose.kneeL}><Leg /></Limb>
      <Limb at="94 162" angle={-pose.legR} stretch={pose.kneeR}><Leg /></Limb>

      <ellipse cx="80" cy="136" rx="32" ry="36" fill="#a9713d" />
      <ellipse cx="80" cy="142" rx="20" ry="24" fill="#e9cda3" />

      {!armsOverHead && arms}

      <g transform={`translate(0 ${pose.headY}) rotate(${pose.head} 80 102)`}>
        <circle cx="50" cy="34" r="14" fill="#a9713d" />
        <circle cx="110" cy="34" r="14" fill="#a9713d" />
        <circle cx="50" cy="34" r="7" fill="#8a5a30" />
        <circle cx="110" cy="34" r="7" fill="#8a5a30" />
        <circle cx="80" cy="64" r="38" fill="#b57c46" />
        <ellipse cx="80" cy="77" rx="16" ry="12" fill="#e9cda3" />
        <ellipse cx="80" cy="71" rx="6" ry="4.6" fill="#42301e" />
        <path d="M61 58 Q66 51.5 71 58" stroke="#42301e" strokeWidth="3.4" fill="none" strokeLinecap="round" />
        <path d="M89 58 Q94 51.5 99 58" stroke="#42301e" strokeWidth="3.4" fill="none" strokeLinecap="round" />
        <ellipse cx="56" cy="69" rx="6" ry="4" fill="#e08a8a" opacity="0.55" />
        <ellipse cx="104" cy="69" rx="6" ry="4" fill="#e08a8a" opacity="0.55" />
        <Mouth pose={pose} />
      </g>

      {armsOverHead && arms}
    </g>
  )
}

function Mouth({ pose }) {
  if (pose.mouth === 'o') return <ellipse cx="80" cy="85" rx="5" ry="6" fill="#42301e" />
  if (pose.mouth === 'chew') return <ellipse cx="80" cy="84" rx="6" ry={4.5 * pose.chew} fill="#42301e" />
  return <path d="M72 80 Q80 90 88 80 Z" fill="#42301e" />
}

function Limb({ at, angle, stretch = 1, children }) {
  return <g transform={`translate(${at}) rotate(${angle}) scale(1 ${stretch})`}>{children}</g>
}

// Hangs down from the shoulder; whatever the paw holds is drawn past the paw
function Arm({ children }) {
  return (
    <>
      <rect x="-8" y="-4" width="16" height="42" rx="8" fill="#a9713d" />
      <circle cx="0" cy="32" r="5" fill="#e9cda3" />
      {children}
    </>
  )
}

function Leg() {
  return (
    <>
      <ellipse cx="0" cy="12" rx="12" ry="16" fill="#a9713d" />
      <ellipse cx="0" cy="22" rx="7" ry="4.5" fill="#e9cda3" />
    </>
  )
}
