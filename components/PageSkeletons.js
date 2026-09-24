import Skeleton, { SkeletonPage } from './ui/Skeleton'
import styles from './PageSkeletons.module.css'

// Placeholders shaped like the real pages, shown while progress loads, so
// content fades in where it will actually sit instead of after a spinner.

const TREE_ROWS = [1, 2, 1, 2]

export function HomeSkeleton() {
  return (
    <SkeletonPage className={styles.page}>
      <div className={styles.homeHeader}>
        <Skeleton width={180} height={30} />
        <div className={styles.row}>
          {[0, 1, 2].map(i => <Skeleton key={i} width={34} height={34} circle />)}
        </div>
      </div>
      <div className={styles.main}>
        <Skeleton height={66} radius="var(--r-lg)" />
        <div className={styles.card}>
          <div className={styles.row}>
            <Skeleton width={64} height={64} circle />
            <div className={styles.lines}>
              <Skeleton width="40%" height={14} />
              <Skeleton width="75%" height={20} />
              <Skeleton width="30%" height={12} />
            </div>
          </div>
          <Skeleton height={50} radius="var(--r)" />
        </div>
        <div className={styles.grid3}>
          {[0, 1, 2].map(i => <Skeleton key={i} height={84} radius="var(--r-lg)" />)}
        </div>
        <div className={styles.tree}>
          {TREE_ROWS.map((count, r) => (
            <div key={r} className={styles.treeRow}>
              {Array.from({ length: count }, (_, i) => (
                <div key={i} className={styles.bubble}>
                  <Skeleton width={120} height={120} circle />
                  <Skeleton width={80} height={16} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </SkeletonPage>
  )
}

export function TopicSkeleton() {
  return (
    <SkeletonPage className={styles.page}>
      <div className={styles.subHeader}>
        <Skeleton width={90} height={22} />
        <Skeleton width={90} height={36} radius="var(--r)" />
      </div>
      <div className={styles.main}>
        <div className={styles.card}>
          <div className={styles.row}>
            <Skeleton width={84} height={84} circle />
            <div className={styles.lines}>
              <Skeleton width="55%" height={24} />
              <Skeleton width="80%" height={14} />
              <Skeleton width="100%" height={10} radius="var(--r-pill)" />
            </div>
          </div>
          <Skeleton height={50} radius="var(--r)" />
        </div>
        <div className={styles.path}>
          {[0, 1, 2, 3, 4].map(i => (
            <Skeleton key={i} width={72} height={72} circle style={{ marginLeft: `${[0, 60, 90, 60, 0][i]}px` }} />
          ))}
        </div>
      </div>
    </SkeletonPage>
  )
}

export function ListSkeleton({ rows = 6 }) {
  return (
    <SkeletonPage className={styles.page}>
      <div className={styles.subHeader}>
        <Skeleton width={120} height={22} />
      </div>
      <div className={styles.main}>
        <Skeleton height={86} radius="var(--r-lg)" />
        {Array.from({ length: rows }, (_, i) => <Skeleton key={i} height={62} radius="var(--r)" />)}
      </div>
    </SkeletonPage>
  )
}
