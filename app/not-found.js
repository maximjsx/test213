import Link from 'next/link'
import Bear from '../components/Bear'
import styles from './not-found.module.css'

export const metadata = {
  title: 'Page Not Found',
}

export default function NotFound() {
  return (
    <div className={styles.page}>
      <div className={styles.bear}>
        <Bear mood="sad" size={140} />
      </div>
      <div className={styles.code}>404</div>
      <h1 className={styles.title}>Lost in translation</h1>
      <p className={styles.text}>This page wandered off the course map. Let&apos;s get you back on track.</p>
      <Link href="/" className={styles.homeBtn}>BACK TO COURSE</Link>
    </div>
  )
}
