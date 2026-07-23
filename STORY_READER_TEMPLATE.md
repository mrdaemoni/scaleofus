# Adding a book to the Scale of Us reader

The platform has one shared reader and a registry of books. A book is data and
assets, not a copy of the player.

## Start a book

```sh
npm run new:book -- a-lowercase-slug "The Book Title"
```

This creates `src/books/a-lowercase-slug/` and registers it in
`src/books/index.ts`. Registration automatically supplies:

- `/books/a-lowercase-slug/`
- a card in `/library/`
- build-time story validation
- the shared reading and listening experience

The root route remains the special entrance for *The Boy Who Tried to Catch
the Wind*. Future books use their `/books/<slug>/` route.

## Book folder contract

Each book folder contains:

- `manuscript.md`: the canonical text and drawing prompts
- `reader.ts`: title, introduction, narration, artwork map, and voice passages
- `story-timings.json`: the start and end of each reading beat
- `story-word-timings.json`: word-level narration timing
- `story-heading-timings.json`: spoken cover and chapter-title timing
- `book.ts`: assembles the files and presentation metadata

The manuscript uses `## Chapter …` headings and
`**Drawing 1 — description**` markers. Each drawing marker starts one reading
beat: one landscape illustration followed by one continuous passage. If art is
missing, the drawing prompt becomes the graceful placeholder for that beat.

## Prepare narration

Keep the high-resolution WAV as an authoring master outside `public/`. Browsers
should receive compressed, progressive files:

```sh
npm run prepare:audio -- a-lowercase-slug "/absolute/path/to/narration.wav"
```

The command creates:

- `public/books/a-lowercase-slug/audio/narration.mp3`
- `public/books/a-lowercase-slug/audio/narration.m4a`

It also prints the duration to copy into `reader.ts`. MP3 is the primary source
because it resumes cleanly with ordinary byte-range requests; fast-start M4A is
the fallback. Do not ship the WAV, split the recording into chapters, or add a
streaming framework for a book-sized recording.

Generate beat and word timing JSON with
`scripts/generate-story-word-timings.py`. The generator can transcribe through
`faster-whisper` or consume OpenAI Whisper word timestamps through
`--transcript-json`. The manuscript stays canonical even when a transcript
differs. Keep roughly four seconds of quiet between chapters so each spoken
chapter title has a clear transition.

Set `narrationAvailable: true` only after all three timing files are complete.
The production build rejects drift, missing beats, unknown speakers, and broken
asset references.

## Add drawings

Put runtime art in `public/books/<slug>/art/`. Map art to story beats explicitly
in `reader.ts`; drawing filenames do not have to match beat numbers.

For a dynamic SVG, provide:

- the SVG used on desktop
- a small WebP still in `mobileSrc` for the mobile fallback and constrained
  devices

Only the active drawing is allowed to animate. The shared runtime pauses and
releases inactive scenes. Do not preload a whole book, embed large raster data
inside SVGs, add GIF loops, or build a separate animation runtime for each
story. Prefer SVG strokes and small transforms over blur and full-screen
compositor layers.

## Style voices and chapters

Voice IDs are local to a book. Map each ID to a shared visual role in
`speakerStyles`, then list only the exact dialogue passages in `voices`.
Unlisted text remains narration. The build requires each passage to match the
manuscript exactly once.

Chapter palettes and optional companion material live in `book.ts`. Use
`navigation: { kind: "chapters" }` for the default reusable navigation.
The first book keeps its bespoke mountain through
`navigation: { kind: "mountain" }`.

## Performance contract

The production build enforces budgets for:

- reader HTML and timed-word count
- JavaScript and CSS
- narration files
- individual SVG and mobile-raster drawings
- the complete deployed site

`npm run build` also removes authoring galleries, HLS experiments, old studies,
and animation tests from `dist/` without deleting their source files. The
listening hot path updates only the previous and current beat, and the
atmospheric drawing modules load after interaction or idle time.

Before publishing a new book:

1. Run `npm run build`.
2. Read every validation error; do not bypass a budget.
3. Test the book locally in reading and listening modes.
4. Test a mobile viewport and one real phone through the full narration.
5. Run `npm run build:pages` and publish only the validated output.
