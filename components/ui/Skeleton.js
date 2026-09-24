import styles from './Skeleton.module.css'

// A shimmering placeholder block. Size it with width/height (any CSS length)
// or pass a className. `circle` makes it round.
export default function Skeleton({ width, height = 16, radius, circle = false, className = '', style }) {
  return (
    <span
      aria-hidden="true"
      className={`${styles.skeleton} ${className}`}
      style={{ width, height, borderRadius: circle ? '50%' : radius, ...style }}
    />
  )
}

// Wraps a page-shaped skeleton so screen readers hear one "Loading" instead of
// a pile of empty blocks.
export function SkeletonPage({ label = 'Loading', className = '', children }) {
  return (
    <div className={className} role="status" aria-busy="true" aria-label={label}>
      {children}
    </div>
  )
}
