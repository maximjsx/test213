# BulgaroLearn

A Duolingo-style Bulgarian language learning app. Config-driven, no accounts needed — progress saved in your browser.

## Setup

```bash
npm install
npm run dev
```

Then open http://localhost:3000

## Structure

```
data/
  course.js          ← ALL lesson content lives here (edit to add more)
components/
  ExerciseRunner.js  ← handles exercise flow, hearts, progress bar
  LessonNotes.js     ← markdown lesson notes before exercises
  LessonComplete.js  ← score screen
  exercises/
    MultipleChoice.js
    TranslateInput.js  ← used for both to-BG and to-EN exercises
    FillBlank.js
hooks/
  useProgress.js     ← localStorage progress tracking
lib/
  checker.js         ← fuzzy answer checking, transliteration
app/
  page.js            ← course map (home)
  lesson/[id]/       ← lesson page
```

## Adding Content

Edit `data/course.js`. Add units, lessons, and exercises:

### Exercise types

**multiple_choice**
```js
{
  type: "multiple_choice",
  id: "unique-id",
  question: "What does X mean?",
  choices: ["Option A", "Option B", "Option C"],
  answer: "Option A",
}
```

**translate_to_en** / **translate_to_bg**
```js
{
  type: "translate_to_bg",
  id: "unique-id",
  prompt: "Hello, how are you?",
  answer: "Здравей, как си?",
  hint: "здравей = hello",
  translitMap: { "zdravey": "Здравей", "kak": "как", "si": "си" },
}
```

**fill_blank**
```js
{
  type: "fill_blank",
  id: "unique-id",
  sentence: "Аз ___ жена.",
  answer: "съм",
  hint: "1st person singular of to be",
}
```

### Transliteration for Bulgarian input

Users can type in Roman letters. The `translitMap` in each exercise maps
common romanizations to Cyrillic (e.g. `"zhena" → "жена"`). The global
map in `lib/checker.js` handles letter-by-letter conversion.
