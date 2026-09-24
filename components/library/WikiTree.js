import Link from 'next/link'
import { wikiChildren, shortTitle } from '../../lib/wiki'
import styles from './Library.module.css'

// The wiki's sections and their pages, for sidebars. `current` highlights
// the open page and expands its section.
export default function WikiTree({ current = '' }) {
  return (
    <nav className={styles.panel} aria-label="Wiki sections">
      <h2 className={styles.panelTitle}>Browse the wiki</h2>
      <ul className={styles.tree}>
        {wikiChildren('').map(section => {
          const open = current === section.slug || current.startsWith(section.slug + '/')
          const pages = wikiChildren(section.slug)
          return (
            <li key={section.slug}>
              <Link href={`/wiki/${section.slug}`} className={`${styles.treeLink} ${current === section.slug ? styles.treeOn : ''}`}>
                {shortTitle(section.title)}
                {pages.length > 0 && <span className={styles.treeCount}>{pages.length}</span>}
              </Link>
              {open && pages.length > 0 && (
                <ul className={styles.subtree}>
                  {pages.map(p => (
                    <li key={p.slug}>
                      <Link href={`/wiki/${p.slug}`} className={`${styles.treeLink} ${styles.treeSub} ${current === p.slug || current.startsWith(p.slug + '/') ? styles.treeOn : ''}`}>
                        {shortTitle(p.title)}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
