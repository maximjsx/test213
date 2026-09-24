'use client'
import { useDialog } from '../../hooks/useDialog'
import styles from './Modal.module.css'

// Overlay + card with focus trap, Escape to close and click-outside to close.
//   title:       rendered as the heading and used as the accessible name
//   label:       accessible name when there is no visible title
//   icon:        optional art above the title (mascot, icon image)
//   dismissable: false for celebrations that need an explicit button
//   accent:      border color, e.g. var(--orange) for streak moments
//   role:        'alertdialog' for confirmations
export default function Modal({ title, label, icon, onClose, dismissable = true, accent, role = 'dialog', size = 'md', className = '', children }) {
  const cardRef = useDialog(onClose)
  return (
    <div className={styles.overlay} onClick={dismissable ? onClose : undefined}>
      <div
        ref={cardRef}
        className={`${styles.card} ${styles[size]} ${className}`}
        style={accent ? { '--modal-accent': accent } : undefined}
        role={role}
        aria-modal="true"
        aria-label={label ?? (typeof title === 'string' ? title : undefined)}
        onClick={e => e.stopPropagation()}
      >
        {dismissable && (
          <button className={styles.close} onClick={onClose} aria-label="Close">
            <img src="/icons/gray_x.png" alt="" width={18} height={18} />
          </button>
        )}
        {icon && <div className={styles.icon}>{icon}</div>}
        {title && <h2 className={styles.title}>{title}</h2>}
        {children}
      </div>
    </div>
  )
}

export function ModalText({ children }) {
  return <p className={styles.text}>{children}</p>
}

export function ModalActions({ children }) {
  return <div className={styles.actions}>{children}</div>
}
