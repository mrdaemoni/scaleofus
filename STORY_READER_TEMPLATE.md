# Reusing the immersive story reader

The reader is split into content, story-specific configuration, generated timing, and shared presentation code. A new story should not require rewriting the player or scroll behavior.

## What each story supplies

1. A Markdown manuscript using `## Chapter …` and `**Drawing …**` markers.
2. One audio file for the full narration. Separate chapter files are not required.
3. Sequential artwork files named `beat-01`, `beat-02`, and so on.
4. A reader configuration like `src/content/wind-story-reader.ts` containing the title, introduction, audio path, artwork paths, motion names, and exact character-voice passages.
5. Beat and word timing JSON. Generate the word cues with `scripts/generate-story-word-timings.py`; the manuscript remains the canonical text even when transcription differs.

Each drawing marker becomes one visual reading unit: one illustration followed by one continuous passage. If a beat contains several Markdown paragraphs, the reader joins them for presentation without changing their words, voice annotations, or word timings. This gives every story the same calm image-then-text rhythm while leaving the manuscript as the source of truth.

Every reading unit also renders an integrated drawing placeholder beneath its artwork. When an image path is missing or the file cannot load, the placeholder appears automatically with the beat number and drawing prompt, so unfinished stories keep the same visual cadence and the prompt remains ready for the illustrator.

## Shared behavior

- `src/lib/story-reader.ts` validates voice passages, assigns a speaker to each rendered word, and resolves artwork paths.
- `src/scripts/story-player.ts` synchronizes words, reading units, chapters, audio progress, manual seeking, and viewport-aware illustration fitting.
- `src/styles/global.css` defines the reusable narrator, child, human character, machine, house, and wind treatments. The current word keeps its soft wind-wake when narration pauses; as speech advances, earlier words retain a brief fading trail so the emphasis moves like one continuous current instead of blinking between isolated words.

## Voice annotation rule

Add only the words actually spoken to the story configuration. Each passage must match the manuscript exactly once. Unannotated words remain third-person narration. This keeps character styling explicit and makes mistakes fail during the build instead of appearing silently on the published story.
