'use client'
import { useEffect, useRef } from 'react'

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'

// Keyboard behaviour for a modal: focus moves in, Tab stays inside, Escape
// closes, and focus goes back to whatever opened it. Returns a ref for the card.
export function useDialog(onClose) {
  const ref = useRef(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    const opener = document.activeElement
    const card = ref.current
    const initial = card?.querySelector('[data-autofocus]') || card?.querySelector(FOCUSABLE)
    initial?.focus()

    function onKeyDown(e) {
      // Lesson shortcuts (Enter to check, 1-4 to pick) listen on window and
      // must not fire behind an open dialog
      e.stopPropagation()
      if (e.key === 'Escape') {
        closeRef.current()
        return
      }
      if (e.key !== 'Tab' || !card) return
      const items = [...card.querySelectorAll(FOCUSABLE)]
      if (!items.length) return
      const first = items[0]
      const last = items.at(-1)
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      opener?.focus?.()
    }
  }, [])

  return ref
}
