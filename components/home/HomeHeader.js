import Link from 'next/link'
import HomeStats from './HomeStats'
import styles from './Home.module.css'

// Phones and tablets only; on desktop the stats sit at the top of the sidebar
// and the brand lives in the navigation rail.
export default function HomeHeader(props) {
  return (
    <header className={styles.header}>
      <Link href="/" className={styles.logo} aria-label="Learn Bulgarian home">
        <img src="/icons/bulgarian_flag.png" alt="" width={34} height={34} />
        <span className={styles.logoName}>Learn Bulgarian<sup className={styles.betaBadge}>Beta</sup></span>
      </Link>
      <HomeStats {...props} />
    </header>
  )
}
