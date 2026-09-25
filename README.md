# Learn Bulgarian

A Duolingo-style Bulgarian course. Progress is saved in your browser. Optional Discord sign-in backs progress up to MongoDB and unlocks the leaderboard.

## Setup

```bash
bun install
bun run dev
```

Then open http://localhost:3000

### Discord sign-in (optional)

Accounts, progress sync and the leaderboard need three env vars in `.env.local`:

1. Create an app at https://discord.com/developers/applications
2. OAuth2 tab: add redirect URLs `http://localhost:3000/api/auth/callback` and `https://learn.bulgarian.dev/api/auth/callback`
3. Fill in `DISCORD_CLIENT_ID` and `DISCORD_CLIENT_SECRET`
4. Set `AUTH_SECRET` to a long random string (session cookie signing), e.g. `bun -e "console.log(crypto.randomBytes(32).toString('hex'))"`
5. In production also set `BASE_URL=https://learn.bulgarian.dev` so OAuth redirects use the right origin

Without these, the site works exactly as before, local-only.

## Adding content

Topics are built in the Topic Builder at `/builder`, which flags anything a learner would trip over (missing answers, choices without the answer, half-filled pairs). When a topic has no warnings left:

```bash
bun run add-topic path/to/exported-level.json
```

This validates the file again, writes it to `data/`, and registers it in `data/course.js`. Commit and push to publish.

## Code map

See `CLAUDE.md` for where things live, how to add an exercise type, and the styling rules.
