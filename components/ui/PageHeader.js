import Link from 'next/link'
import Chevron from '../Chevron'
import styles from './PageHeader.module.css'

// Sticky top bar for sub pages: a back link, an optional title, and actions on
// the right. Lines up with the 640px content column on wide screens.
export default function PageHeader({ backHref = '/', backLabel = 'Course', title, children }) {
  return (
    <header className={styles.header}>
      <Link href={backHref} className={styles.back}><Chevron /> {backLabel}</Link>
      {title && <h1 className={styles.title}>{title}</h1>}
      {children && <div className={styles.actions}>{children}</div>}
    </header>
  )
}
