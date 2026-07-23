# Scale of Us

Small books about big machines and the humans trying not to forget themselves.

This is a reusable illustrated-book platform for `scaleofus.com`. *The Boy Who
Tried to Catch the Wind* is the first book. Each book supplies a manuscript,
timings, artwork, narration, and a small configuration object; the shared
reader owns playback, follow-along navigation, responsive fitting, word
highlighting, and memory-conscious drawing activation.

## Commands

```sh
npm install
npm run dev
npm run build
npm run build:pages
npm run new:book -- a-lowercase-slug "The Book Title"
npm run prepare:audio -- a-lowercase-slug "/absolute/path/to/narration.wav"
```

`npm run build` creates a production build, removes authoring-only experiments,
and enforces reader budgets. `npm run build:pages` additionally replaces
`docs/` with that validated build for GitHub Pages.

## Structure

- `src/books/` is the book registry. Each book keeps its manuscript,
  configuration, and compact timing JSON together.
- `src/components/StoryReader.astro` is the shared reader shell.
- `src/lib/story-reader.ts` parses and validates manuscripts, voices, artwork,
  and timing contracts at build time.
- `src/scripts/story-player.ts` owns the audio clock and reading/listening
  state machine.
- `public/books/<slug>/` is the default home for a new book's runtime audio and
  artwork. Existing older paths remain supported.
- `/library/` is derived from the registry, so a registered book appears there
  without a second content list.

The current first book lives in
`src/books/the-boy-who-tried-to-catch-the-wind/`. Its drawing sources remain in
`public/images/wind-story/`, and its compressed narration remains in
`public/audio/`.

Read [STORY_READER_TEMPLATE.md](./STORY_READER_TEMPLATE.md) before adding a
book. It documents the plug-in contract, timing workflow, and performance
rules.

## Publishing

Run `npm run build:pages`, commit the source changes and generated `docs/`
folder, then push `main`. GitHub Pages publishes from `main` and `/docs`.
