import Link from 'next/link'
import styles from './Button.module.css'

// The one button style for the whole site.
//   variant: primary | secondary | danger | ghost
//   size:    sm | md | lg
//   color:   optional accent for primary, e.g. a topic color
//   href:    renders a Next.js Link instead of a <button>
export default function Button({ variant = 'primary', size = 'md', block = false, color, href, className = '', style, children, ...rest }) {
  const cls = [styles.btn, styles[variant], styles[size], block && styles.block, className].filter(Boolean).join(' ')
  const accent = color ? { '--btn-bg': color, ...style } : style
  if (href) return <Link href={href} className={cls} style={accent} {...rest}>{children}</Link>
  return <button type="button" className={cls} style={accent} {...rest}>{children}</button>
}
