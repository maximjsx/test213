# Learn Bulgarian (bulgario)

Duolingo-style Bulgarian course at https://learn.bulgarian.dev. Next.js 14 App Router, plain JavaScript, CSS Modules, MongoDB for accounts. Deployed on Vercel from `master`.

## Commands

Only `bun` is installed. Never use npm or npx.

- `bun run dev`: dev server on :3000
- `bun run build`: production build, the check to run before committing
- `bun run add-topic path/to/level.json`: validates a builder export and adds it to the course
- `bun scripts/make-app-icons.js`: regenerates `public/icon-192.png` and `icon-512.png`

## Where things live

```
data/            Course content. One JSON file per topic ("level"), registered in data/course.js.
lib/course.js    Every lookup over the course: findLevel, findLesson, resume lesson, exercise order, lesson XP.
lib/levelSchema.js  Content validator shared by the builder UI and add-topic.
lib/builderStore.js Builder levels in localStorage, share links, JSON export.
hooks/useProgress.js  Learner state (XP, streak, lessons, mistakes, quests). localStorage for guests, /api/progress for accounts.
components/ui/   Shared primitives: Button, Modal, PageHeader, Skeleton, Markdown. Use these, don't restyle.
components/exercises/  One component per exercise type, played by components/ExerciseRunner.js.
components/builder/    Level editor pieces. exerciseTypes.js is the builder's catalogue of types.
components/home/       Home page sections.
components/PageSkeletons.js  Loading placeholders shaped like each page.
app/api/         Route handlers (auth via Discord, progress, leaderboard, certificates, voiceovers, storage proxy).
lib/seo.js       SITE_URL, privatePage() for noindex pages. app/sitemap.js and app/robots.js list public routes.
```

Terminology: a **level** in code is a **topic** in the UI. A topic has lessons, a lesson has exercises.

## Content workflow

1. Build a topic in `/builder`. Drafts live in localStorage and back up to the builder's account (`builder_levels` collection, `lib/builderStore.js` sync). Fix every orange validation badge.
2. Publish: either Export JSON, run `bun run add-topic file.json`, commit and push; or the super-admin's Publish button, which commits `data/<id>.json` and `data/course.js` to master through the GitHub API (`GITHUB_TOKEN`, `GITHUB_REPO`, optional `GITHUB_BRANCH`). Both run the same checks in `lib/publishTopic.js`. Course content only ever lives in repo files.
3. Lesson and exercise ids must be unique across the course, since progress and mistakes are stored by id.

## Adding an exercise type

1. `components/exercises/NewType.js`, props: `exercise, onAnswer, onPendingChange, checkTrigger, disabled, levelColor`.
2. Register it in `EXERCISE_MAP` in `components/ExerciseRunner.js`.
3. Add it to `EXERCISE_TYPES`, `defaultExercise` and `exerciseSummary` in `components/builder/exerciseTypes.js`.
4. Add an editor case in `components/builder/ExerciseEditor.js`.
5. Add a rule in `lib/levelSchema.js` (the optional `register` and `usage` tags are checked for every type there already) and, if it matters for ordering, a tier in `DIFFICULTY` in `lib/course.js`.

## Styling rules

- Dark theme only. Colors, radii, font sizes and z-index come from the tokens in `app/globals.css`. No raw hex in modules.
- Buttons are `components/ui/Button` (variants primary, secondary, danger, ghost; `color` for a topic accent). Dialogs are `components/ui/Modal`.
- Loading states use skeletons from `components/PageSkeletons.js`, not spinners. `LoadingBear` is only for the lesson intro.
- In CSS modules here, media queries often sit above the base rules. Scope overrides under a parent class or they lose on source order.
- No unicode glyph icons or emoji in new UI; use the PNGs in `public/icons` or inline SVG. No em or en dashes in copy.
- Mobile first: check 375px, and remember the fixed bottom nav (`components/BottomNav.js`) below 680px.

## Gotchas

- Most pages are client components because progress lives in the browser. Metadata for them goes in a sibling `layout.js`.
- `useProgress` and `useAuth` cache module-level state so tab switches don't flash loaders. Keep that when changing them.
- `coins` is the one currency: a spendable balance, while rankings use coins earned per day (`coinsByDay`, `lib/coins.js`), so spending never lowers rank.
- Special topics (`special: { price?, guild? }` on a level) show locked on home. `lib/specialTopics.js` decides the lock; Discord server membership comes from the `guilds` OAuth scope, stored as `users.guildIds` (only servers the course references).
- `app/opengraph-image.js` runs on the edge runtime because `@vercel/og` in Node breaks on Windows paths.
- `lib/storage.js` is server only (reads STORAGE_API_KEY). Never import it from a client component.
