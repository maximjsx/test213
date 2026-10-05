import styles from './Voice.module.css'

// Heads the studio when it was opened from a recording link
export default function ShareBanner({ request, count, recorded, onLeave }) {
  const pct = count ? Math.round((recorded / count) * 100) : 0
  return (
    <section className={styles.banner} style={request.color ? { '--banner-accent': request.color } : undefined}>
      <div className={styles.bannerTop}>
        <div className={styles.bannerText}>
          <span className={styles.bannerLabel}>Recording request</span>
          <h2 className={styles.bannerTitle}>{request.title}</h2>
          {request.subtitle && <span className={styles.bannerSub}>{request.subtitle}</span>}
        </div>
        <button className={styles.smallBtn} onClick={onLeave}>Whole course</button>
      </div>
      <div className={styles.bannerProgress}>
        <div className={styles.progressBar}><div className={styles.progressFill} style={{ width: `${pct}%` }} /></div>
        <span className={styles.progressText}>{recorded} of {count} done</span>
      </div>
    </section>
  )
}
