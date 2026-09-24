// Props that make a non-button element (one that has to hold other buttons)
// reachable and usable from the keyboard.
export function clickable(onActivate) {
  return {
    role: 'button',
    tabIndex: 0,
    onClick: onActivate,
    onKeyDown: e => {
      if (e.target !== e.currentTarget || (e.key !== 'Enter' && e.key !== ' ')) return
      e.preventDefault()
      onActivate()
    },
  }
}
