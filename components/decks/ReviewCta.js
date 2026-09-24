import Link from 'next/link'
import { ArrowRight } from '../home/ResumeCard'
import styles from './Decks.module.css'

export default function ReviewCta({ count, href = '/review', className = '' }) {
  if (!count) return null
  return (
    <Link href={href} className={`${styles.reviewCta} ${className}`}>
      <img src="/icons/open_book.png" alt="" width={32} height={32} />
      <span className={styles.reviewCtaText}>
        <span className={styles.reviewCtaTitle}>Review {count} {count === 1 ? 'card' : 'cards'}</span>
        <span className={styles.muted}>Due today in your decks</span>
      </span>
      <span className={styles.reviewCtaArrow}><ArrowRight /></span>
    </Link>
  )
}
