import Skeleton, { SkeletonPage } from './ui/Skeleton'
import styles from './PageSkeletons.module.css'
import home from './home/Home.module.css'

// Placeholders shaped like the real pages, shown while progress loads, so
// content fades in where it will actually sit instead of after a spinner.

const GRID_BUBBLES = 6

// Uses the home page's own layout classes so every card lands where the real
// one will, on phones (one column) and desktop (path plus sidebar).
export function HomeSkeleton() {
  return (
    <SkeletonPage className={home.page}>
      <div className={home.header}>
        <Skeleton width={34} height={34} circle />
        <div className={styles.row}>
          {[0, 1, 2].map(i => <Skeleton key={i} width={56} height={30} />)}
        </div>
      </div>
      <div className={home.layout}>
        <div className={home.primary}>
          <div className={`${styles.card} ${home.oResume}`}>
            <div className={styles.row}>
              <Skeleton width={56} height={56} circle />
              <div className={styles.lines}>
                <Skeleton width="40%" height={12} />
                <Skeleton width="75%" height={20} />
                <Skeleton width="30%" height={12} />
              </div>
            </div>
            <Skeleton height={50} radius="var(--r)" />
          </div>
          <div className={`${styles.homeGrid} ${home.oTree}`}>
            {Array.from({ length: GRID_BUBBLES }, (_, i) => (
              <div key={i} className={styles.bubble}>
                <Skeleton width={120} height={120} circle />
                <Skeleton width={90} height={16} />
              </div>
            ))}
          </div>
        </div>
        <div className={home.aside}>
          <Skeleton className={home.asideStats} height={56} radius="var(--r-lg)" />
          <Skeleton className={home.oGoal} height={70} radius="var(--r-lg)" />
          <div className={`${styles.grid3} ${home.oTiles}`}>
            {[0, 1, 2].map(i => <Skeleton key={i} height={92} radius="var(--r-lg)" />)}
          </div>
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
