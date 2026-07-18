# Reusing the immersive story reader

The reader is split into content, story-specific configuration, generated timing, and shared presentation code. A new story should not require rewriting the player or scroll behavior.

## What each story supplies

1. A Markdown manuscript using `## Chapter …` and `**Drawing …**` markers.
2. One audio file for the full narration. Separate chapter files are not required.
3. Sequential artwork files named `beat-01`, `beat-02`, and so on.
4. A reader configuration like `src/content/wind-story-reader.ts` containing the title, introduction, audio path, artwork paths, motion names, and exact character-voice passages.
5. Beat and word timing JSON. Generate the word cues with `scripts/generate-story-word-timings.py`; the manuscript remains the canonical text even when transcription differs.

## Shared behavior

- `src/lib/story-reader.ts` validates voice passages, assigns a speaker to each rendered word, and resolves artwork paths.
- `src/scripts/story-player.ts` synchronizes words, paragraphs, chapters, audio progress, manual seeking, and viewport-aware illustration fitting.
- `src/styles/global.css` defines the reusable narrator, child, human character, machine, house, and wind treatments.

## Voice annotation rule

Add only the words actually spoken to the story configuration. Each passage must match the manuscript exactly once. Unannotated words remain third-person narration. This keeps character styling explicit and makes mistakes fail during the build instead of appearing silently on the published story.
