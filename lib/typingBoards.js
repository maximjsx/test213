// Typing test settings. Each length and text pair is its own board, since a
// minute of sentences is a different race from 30 seconds of single words.
export const TYPING_DURATIONS = [30, 60]
export const TYPING_SOURCES = [
  { id: 'words', label: 'Words' },
  { id: 'sentences', label: 'Sentences' },
]

export const typingBoard = (duration, source) => `${duration}-${source}`

export function isTypingBoard(board) {
  const [duration, source] = String(board).split('-')
  return TYPING_DURATIONS.includes(Number(duration)) && TYPING_SOURCES.some(s => s.id === source)
}
