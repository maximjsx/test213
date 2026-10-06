// Lessons finished for the first time in this tab. Only these animate on the
// topic path, since replaying a finished lesson unlocks nothing new.
const firstCompletions = new Set()

export function noteCompletion(lessonId, wasComplete) {
  if (!wasComplete) firstCompletions.add(lessonId)
}

// True once per first completion
export function claimFirstCompletion(lessonId) {
  return firstCompletions.delete(lessonId)
}
