// Recording requests are plain links: /voice?topic=<levelId>&lesson=<lessonId>&words=банан,котка
// Every filter given applies, so a lesson link can also name a topic.
import { voiceKey } from './voicePhrases'

export function readShare(search) {
  const params = new URLSearchParams(search)
  const words = [...params.getAll('words'), ...params.getAll('word')]
    .flatMap(w => w.split(','))
    .map(voiceKey)
    .filter(Boolean)
  const share = { topic: params.get('topic'), lesson: params.get('lesson'), words }
  return share.topic || share.lesson || words.length ? share : null
}

export function sharedPhrases(phrases, share) {
  const words = new Set(share.words)
  return phrases.filter(p =>
    (!share.topic || p.uses.some(u => u.levelId === share.topic)) &&
    (!share.lesson || p.uses.some(u => u.lessonId === share.lesson)) &&
    (!words.size || words.has(p.key))
  )
}

// Cyrillic stays readable in the link; only characters a URL can't hold get escaped
const encode = value => value.replace(/[^\p{L}\p{N},._-]/gu, encodeURIComponent)

export function shareLink(origin, { topic, lesson, words }) {
  const parts = []
  if (topic) parts.push(`topic=${encode(topic)}`)
  if (lesson) parts.push(`lesson=${encode(lesson)}`)
  if (words?.length) parts.push(`words=${encode(words.join(','))}`)
  return `${origin}/voice${parts.length ? '?' + parts.join('&') : ''}`
}

export function describeShare(share, levels) {
  const level = levels.find(l => l.id === share.topic) ||
    (share.lesson && levels.find(l => l.lessons.some(ls => ls.id === share.lesson)))
  const lessonIndex = level && share.lesson ? level.lessons.findIndex(ls => ls.id === share.lesson) : -1
  if (lessonIndex >= 0) {
    return { title: level.lessons[lessonIndex].title, subtitle: `${level.title}, lesson ${lessonIndex + 1}`, color: level.color }
  }
  if (level && !share.words.length) return { title: level.title, subtitle: 'Every word in this topic', color: level.color }
  return { title: 'Words picked for you', subtitle: level ? `From ${level.title}` : null, color: level?.color }
}
