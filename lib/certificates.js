import { COURSE } from '../data/course'

// Each certificate is earned by finishing every lesson in its topics.
// The A1 tier follows the whole course, so new topics raise the bar for
// future claims while already issued certificates keep their snapshot.
export const CERTIFICATES = [
  {
    id: 'cyrillic',
    title: 'Cyrillic Alphabet',
    level: 'Foundations',
    seal: 'Аа',
    blurb: 'Read and pronounce all 30 letters',
    levelIds: ['alphabet'],
  },
  {
    id: 'a1',
    title: 'Bulgarian A1',
    level: 'Beginner',
    seal: 'A1',
    blurb: 'Every core topic in the course, from greetings to school',
    // Special topics are optional, so they never block a certificate
    levelIds: COURSE.levels.filter(l => !l.special).map(l => l.id),
  },
]

export function findCertificate(tierId) {
  return CERTIFICATES.find(c => c.id === tierId) || null
}

export function certificateLessons(cert) {
  return COURSE.levels
    .filter(level => cert.levelIds.includes(level.id))
    .flatMap(level => level.lessons)
}

export function certificateProgress(cert, lessons = {}) {
  const all = certificateLessons(cert)
  const done = all.filter(l => lessons[l.id]?.completed).length
  return { done, total: all.length, complete: all.length > 0 && done === all.length }
}

export function formatCertificateDate(date) {
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Sofia',
  })
}
