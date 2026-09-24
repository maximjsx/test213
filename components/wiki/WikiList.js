import Link from 'next/link'
import { ArrowRight } from '../home/ResumeCard'
import styles from './Wiki.module.css'

export default function WikiList({ pages }) {
  return (
    <ul className={styles.list}>
      {pages.map(p => (
        <li key={p.slug}>
          <Link href={`/wiki/${p.slug}`} className={styles.item}>
            <span className={styles.itemTitle}>{p.title}</span>
            {p.warning && <span className={styles.warnTag}>Vulgar</span>}
            <ArrowRight size={18} />
          </Link>
        </li>
      ))}
    </ul>
  )
}
