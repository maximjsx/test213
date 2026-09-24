import styles from './Tooltip.module.css'

// Hover and keyboard-focus hint for icon-only controls. The control keeps its
// own aria-label; this is the visible version for mouse and keyboard users.
// align="end" pins the hint to the right edge, for controls near the screen edge.
export default function Tooltip({ label, align = 'center', children }) {
  return (
    <span className={`${styles.wrap} ${styles[align]}`}>
      {children}
      <span className={styles.tip} aria-hidden="true">{label}</span>
    </span>
  )
}
