import Link from 'next/link'
import Chevron from '../Chevron'
import styles from './PageHeader.module.css'

// Sticky top bar: a back link on the left, the title centred, actions on the
// right. Tab pages pass backHref={null}: the app navigation gets you around.
export default function PageHeader({ backHref = '/', backLabel = 'Course', title, children }) {
  return (
    <header className={styles.header}>
      <div className={styles.side}>
        {backHref && <Link href={backHref} className={styles.back} aria-label={`Back to ${backLabel}`}><Chevron /> <span className={styles.backLabel}>{backLabel}</span></Link>}
      </div>
      {title ? <h1 className={styles.title}>{title}</h1> : <span />}
      <div className={`${styles.side} ${styles.actions}`}>{children}</div>
    </header>
  )
}
