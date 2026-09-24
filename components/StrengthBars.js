import { MAX_STRENGTH } from '../lib/words'
import styles from './Practice.module.css'

const LABELS = ['Not learned yet', 'Needs practice', 'Getting weaker', 'Strong', 'Fresh']

export default function StrengthBars({ strength }) {
  return (
    <span className={`${styles.bars} ${strength <= 2 ? styles.barsWeak : ''}`} role="img" aria-label={LABELS[strength]} title={LABELS[strength]}>
      {Array.from({ length: MAX_STRENGTH }, (_, i) => (
        <span key={i} className={`${styles.bar} ${i < strength ? styles.barOn : ''}`} />
      ))}
    </span>
  )
}
