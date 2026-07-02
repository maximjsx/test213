// Chevron icon for back buttons and nav, dir: left | right
export default function Chevron({ dir = 'left', size = 16 }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="3.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ display: 'block', transform: dir === 'right' ? 'scaleX(-1)' : undefined }}
    >
      <polyline points="15 5 8 12 15 19" />
    </svg>
  )
}
