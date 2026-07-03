import Bear from './Bear'
import styles from './LoadingBear.module.css'

// Duolingo-style loading screen: the mascot hops in place over a pulsing
// shadow while the label's dots bounce. Fullscreen mode is a fixed overlay so
// the layout footer never peeks through while loading; set fullscreen={false}
// to embed it inside a page section instead.
export default function LoadingBear({ label = 'Loading', size = 96, fullscreen = true }) {
  return (
    <div className={fullscreen ? styles.screen : styles.inline} role="status" aria-label={label}>
      <div className={styles.stage}>
        <div className={styles.hop}>
          <Bear mood="happy" size={size} />
        </div>
        <div className={styles.shadow} />
      </div>
      <div className={styles.label}>
        {label}
        <span className={styles.dots}>
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.dot} />
        </span>
      </div>
    </div>
  )
}
