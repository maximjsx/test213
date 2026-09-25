import styles from './TypingTest.module.css'

export default function Segmented({ options, value, onChange, label }) {
  return (
    <div className={styles.segmented} role="radiogroup" aria-label={label}>
      {options.map(o => (
        <button key={o.id} role="radio" aria-checked={value === o.id} className={`${styles.segment} ${value === o.id ? styles.segmentOn : ''}`} onClick={() => onChange(o.id)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}
