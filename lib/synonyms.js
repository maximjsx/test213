// ─── GLOBAL SYNONYM DICTIONARY ────────────────────────────────────────────────
//
// One place to declare answers that mean the same thing across the WHOLE course,
// so we never have to copy "Pleased to meet you / Glad to meet you / ..." into
// every single lesson that happens to use that phrase.
//
// How it's used (see lib/checker.js):
//   A group only ever affects an exercise whose OWN accepted answer is a member of
//   that group. So adding ['nice to meet you', 'pleased to meet you'] here just
//   means: any exercise whose answer is one of those will also accept the others.
//   It can never make an unrelated exercise accept a wrong answer.
//
// Two kinds of groups, both live in the same list:
//   - Phrase groups  — full-sentence equivalents (["nice to meet you", ...]).
//   - Word groups    — single interchangeable words. When every member of a group
//                      is one word, it also works INSIDE longer sentences, e.g.
//                      the group ["pedal", "peder", "pederast"] lets "ti si pedal"
//                      and "ti si peder" both pass.
//
// Matching is case/punctuation/apostrophe-insensitive (the checker normalizes
// first), so write the nicest human form here — "Pleased to meet you" is fine.

export const SYNONYM_GROUPS = [
  // ── Meeting people ──────────────────────────────────────────────────────────
  [
    'nice to meet you',
    'pleased to meet you',
    'glad to meet you',
    'good to meet you',
    'nice meeting you',
    'pleased to make your acquaintance',
    'nice to meet you too',
    'pleasure to meet you',
  ],
  // Bulgarian forms of the same greeting — the short one and the full one.
  // Lets a translate-to-Bulgarian exercise accept either, and (via translit)
  // "priqtno mi e da se zapoznaem" typed in Roman letters.
  [
    'приятно ми е',
    'приятно ми е да се запознаем',
    'приятно ми е да се запознаем.',
  ],

  // ── Greetings / farewells ────────────────────────────────────────────────────
  ['hello', 'hi', 'hey', 'hiya'],
  ['goodbye', 'bye', 'bye bye', 'good bye'],
  ['good afternoon', 'good day'],

  // ── Courtesy ─────────────────────────────────────────────────────────────────
  ['thank you', 'thanks', 'thank you very much', 'thanks very much', 'thanks a lot', 'thank you a lot', 'many thanks'],
  ["you're welcome", 'welcome', 'no problem', 'my pleasure'],
  ["i'm sorry", 'sorry', 'i am sorry', 'my apologies', 'apologies'],
  ['excuse me', 'pardon', 'pardon me', 'sorry'],

  // ── Single-word groups (also apply inside sentences) ──────────────────────────
  // Keep these tight — every word here becomes interchangeable everywhere.
  ['fine', 'good', 'well', 'okay', 'ok', 'alright', 'all right'],
  ['yes', 'yeah', 'yep', 'yup'],
  ['no', 'nope', 'nah'],
  ['mum', 'mom', 'mommy', 'mummy'],
  ['dad', 'daddy'],

  // ── Slang synonyms (Swear Words / Street Slang packs) ────────────────────────
  // Bulgarian derogatory terms treated as interchangeable answers.
  ['педал', 'педераст', 'педер', 'пед', 'обратен'],
]

// Groups whose members should ALSO be accepted with a friendly nudge rather than
// silently. (Currently unused as a separate mechanism, but reserved so the checker
// can attach notes like "mind the apostrophe" to specific soft matches.)

// Missing / bare apostrophe forms → the word they stand for. These are ONLY forms
// that are not themselves real English words, so expanding them can't corrupt a
// genuine answer. Used to accept lazy typing ("youre", "im") with a small note.
export const BARE_CONTRACTIONS = {
  im: 'i am',
  youre: 'you are',
  hes: 'he is',
  shes: 'she is',
  theyre: 'they are',
  thats: 'that is',
  whats: 'what is',
  wheres: 'where is',
  theres: 'there is',
  heres: 'here is',
  whos: 'who is',
  isnt: 'is not',
  arent: 'are not',
  wasnt: 'was not',
  werent: 'were not',
  dont: 'do not',
  doesnt: 'does not',
  didnt: 'did not',
  cant: 'cannot',
  wont: 'will not',
  couldnt: 'could not',
  wouldnt: 'would not',
  shouldnt: 'should not',
  ive: 'i have',
  youve: 'you have',
  weve: 'we have',
  theyve: 'they have',
  youll: 'you will',
  theyll: 'they will',
}
