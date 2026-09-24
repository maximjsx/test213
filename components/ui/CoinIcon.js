import styles from './CoinIcon.module.css'

export default function CoinIcon({ size = 20, className = '' }) {
  return (
    <svg className={`${styles.coin} ${className}`} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="11" className={styles.rim} />
      <circle cx="12" cy="12" r="8" className={styles.face} />
      <path d="M12 7.5v9M9.6 9.6c0-1 1-1.6 2.4-1.6s2.4.7 2.4 1.6-1 1.4-2.4 1.6-2.4.7-2.4 1.7 1 1.6 2.4 1.6 2.4-.6 2.4-1.6" className={styles.mark} />
    </svg>
  )
}
