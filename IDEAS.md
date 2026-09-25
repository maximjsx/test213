# Ideas for later

Not scheduled. Notes for a future session; check with the owner before building any of these.

## Learn together / multiplayer

- Live games between two (or more) signed-in learners using course words, decks or the glossary: memory (flip pairs), word guessing (hangman / Wordle-like with Bulgarian words), speed matching head to head, "translate first wins" races.
- Competitive and co-op modes: ranked 1v1 with its own rating, or a shared goal played together.
- Peer to peer to keep server costs down: WebRTC data channels between players, with the server only doing matchmaking and signalling (a tiny route or a hosted signalling service). Results that affect coins or rank still need a server check, since a peer can lie about its score.
- Discord reveal: everyone signs in with Discord, so after a game both players can agree (both must opt in) to reveal their Discord usernames to each other and keep talking there. Never reveal one-sided; the privacy page needs a line about it.
- Study sessions: pick a friend (friends already exist in `friends` collection and friend quests), then review the same deck side by side or quiz each other.

## Translation prompts with native review

Modelled on the Discord bot the community already uses:

```
!generate A1-3-words
Bot: The cat slept.
     A native speaker will review your translation (if you are lucky)
User: Котката спи
Bot: Браво, точно така.
     The cat sleeps peacefully.
```

- On the site: a prompt by level and length (A1, 3 words), the learner types a translation, gets an instant check against accepted answers, and the attempt goes into a queue that native speakers (builder users or a "reviewer" role) can approve or correct. Reviewed answers can become new accepted answers.
- Could share one queue with the Discord bot so reviews happen in either place.

## Community Q&A

- A small forum: questions about grammar, words, slang ("what does X really mean", "is this rude"), answers voted up, native speakers marked. Could attach to a word, a lesson, a wiki page or a glossary entry so questions sit next to the content they are about.
- Keep it small: threads, replies, votes, report button, moderation by builder users. User data in Mongo like everything else.
