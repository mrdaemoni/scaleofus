# Reusing the immersive story reader

The reader is split into content, story-specific configuration, generated timing, and shared presentation code. A new story should not require rewriting the player or scroll behavior.

## What each story supplies

1. A Markdown manuscript using `## Chapter …` and `**Drawing …**` markers.
2. One audio file for the full narration. Separate chapter files are not required. A deliberate pause of about four seconds between chapters gives the shared timing pipeline a reliable chapter-title anchor.
3. Sequential artwork files named `beat-01`, `beat-02`, and so on.
4. A reader configuration like `src/content/wind-story-reader.ts` containing the title, introduction, audio path, artwork paths, motion names, and exact character-voice passages.
5. Beat and word timing JSON. Generate both files with `scripts/generate-story-word-timings.py`; the manuscript remains the canonical text even when transcription differs. The generator aligns the entire manuscript to the recording and derives every reading-unit boundary from the spoken words.
6. A compact heading-timing file like `src/content/story-heading-timings.json`. It holds the spoken cover title, each spoken chapter label and title, and the beginning of the quiet transition before each chapter.

The generator can transcribe through `faster-whisper`, or consume an existing OpenAI Whisper word-timestamp JSON file through `--transcript-json`. Keeping that transcript outside the site is fine; only the compact generated timing JSON ships to readers.

Each drawing marker becomes one visual reading unit: one illustration followed by one continuous passage. If a beat contains several Markdown paragraphs, the reader joins them for presentation without changing their words, voice annotations, or word timings. This gives every story the same calm image-then-text rhythm while leaving the manuscript as the source of truth.

Every reading unit also renders an integrated drawing placeholder beneath its artwork. When an image path is missing or the file cannot load, the placeholder appears automatically with the beat number and drawing prompt, so unfinished stories keep the same visual cadence and the prompt remains ready for the illustrator.

## Shared behavior

- `src/lib/story-reader.ts` validates voice passages and the complete beat-to-word timing contract, assigns a speaker to each rendered word, and resolves artwork paths. Missing beats, word-count drift, out-of-order cues, and unknown speakers stop the build instead of failing in the browser.
- `src/scripts/story-player.ts` synchronizes words, reading units, chapters, audio progress, manual seeking, and viewport-aware illustration fitting. Listening follows a reusable three-scene rhythm: the cover title stays on the cover, the quiet gap carries the reader to the chapter title, and the first spoken sentence carries the reader to its illustration and paragraph.
- `src/styles/global.css` defines the reusable narrator, child, human character, machine, house, and wind treatments. Every spoken word receives a newly varied wake—different reach, lift, angle, thickness, and release time—while earlier words remain in a broader fading current. The effect stays continuous without repeating one mechanical shape.

## Voice annotation rule

Add only the words actually spoken to the story configuration. Each passage must match the manuscript exactly once. Unannotated words remain third-person narration. This keeps character styling explicit and makes mistakes fail during the build instead of appearing silently on the published story.
