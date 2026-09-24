import { REGISTERS } from '../../lib/registers'
import styles from './UsageNote.module.css'

export function RegisterChip({ register }) {
  const r = REGISTERS[register]
  if (!r) return null
  return <span className={styles.chip} style={{ '--chip': r.color }}>{r.label}</span>
}

// Register tag and usage note, shown once the learner has answered
export default function UsageNote({ exercise, centered = false }) {
  if (!exercise?.register && !exercise?.usage) return null
  return (
    <div className={`${styles.note} ${centered ? styles.centered : ''}`}>
      <RegisterChip register={exercise.register} />
      {exercise.usage && <span className={styles.usage}>{exercise.usage}</span>}
    </div>
  )
}
