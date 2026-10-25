---
name: soundtrack-picker
description: Find, audition, select, and mix licensed music around narrated stories, including multilingual timing, chapter transitions, protected silence, endings, and phone listening players. Use for story soundtracks and audiobook music; do not regenerate or rewrite supplied narration.
---

# Soundtrack Picker

Turn a narration and manuscript into a small musical arc the owner can audition and select. Preserve the spoken performance and intentional quiet. Treat choices, timing, canonical masters, and publication as separate decisions; follow the user's existing authorization for each.

## Choose and audition

- Inspect the matching narration, manuscript, heading/word timings, earlier cue maps, and owner choices. Match the actual recording, not a similarly named version.
- Research composers' own track and usage pages. Record the exact recording, source/download URLs, license, retrieval date, checksum, and required credit. Avoid noncommercial or no-derivatives recordings for commercial-capable publication. A generic free-music label is insufficient.
- Propose a few recurring identities rather than a new track for each scene. Include the opening, adventure, chapter turns, invitation, threat/climax, escape, resolution, **and closing**. Include an unscored comparison.
- Make contextual excerpts against the supplied narration. Composer descriptions and signal analysis support proposals; do not claim personally heard quality or human listening acceptance without that evidence.
- Preserve exported owner selections. Reuse selected themes when appropriate; explain an added ending or coda. Examine each new book rather than transferring Catch the Wind's palette or emotional map automatically.

## Mix

[`scripts/mix_soundtrack.py`](scripts/mix_soundtrack.py) uses Python/NumPy and FFmpeg/ffprobe locally. It performs no network, Git, or publication actions. Read [`references/config.md`](references/config.md) for input and output details.

```sh
python3 scripts/mix_soundtrack.py /absolute/mix-config.json --output /absolute/versioned-output
```

Freeze source checksums and cue times before rendering. Map each language independently to spoken beats: chapter headings, the stopped hand, an opening door, returning wind, the end of grief, and final words. Do not uniformly scale timestamps into a translation. Preserve narration timing so word highlighting remains valid.

Use fades, modest speech-range EQ, and one sidechain stage. The renderer starts near a 21.5 dB average voice/music margin in scored speech; adjust to the story and owner preference. A second aggressive speech gate can hide the score. Let music recover in chapter gaps while preserving deliberately quiet transitions. Close the score bus after EQ at protected boundaries so filter tails do not leak into silence.

Export separate versioned WAV, MP3, AAC/M4A, an optional closing excerpt, and validation JSON. Preserve originals and earlier masters. Check full decode, duration, narration immutability, average speech-proxy margin, score-bus silence, loudness, true peak, and hosting size budget. Target about -16 LUFS / at most -1.5 dBTP. The RMS proxy includes existing ambience and does not prove intelligibility or artistic quality.

## Listen and deliver

Local paths and loopback links cannot be opened on a phone. Use an authorized hosted player or connected file destination. [`assets/player.html`](assets/player.html) and [`scripts/build_player.py`](scripts/build_player.py) support language-specific files, chapters, downloads, closing excerpts, and credits. The input manifest is described in the config reference.

Private Sites dispatch may ignore byte ranges even when the MP3 is valid. Verify a live chapter jump. The template buffers a full recording into a local Blob for reliable seeking and stores position per edition. A local Range test does not prove hosted seeking. Respect provider asset limits and use smaller derivatives for an established public-reader budget.

For an explicitly authorized canonical release, archive masters and previous active files; record hashes and source/cue provenance; update URLs/cache versions, durations, reader/download credits, and release records. An appended coda changes total duration while spoken-word times stay unchanged. Build and verify synchronization before pushing. Preserve unrelated work and an existing Site's audience.

## Project example

Read [`references/catch-the-wind.md`](references/catch-the-wind.md) only for that book or a concrete configuration example. Its timestamps and choices belong to those recordings.
