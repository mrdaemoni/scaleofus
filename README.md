# Scale of Us

Small books about big machines and the humans trying not to forget themselves.

This is the standalone site for `scaleofus.com`, built as a sibling project to At the Human Scale.

The current experience is an immersive reading and listening edition of
*The Boy Who Tried to Catch the Wind*. The nine-chapter climb holds all 38
planned drawing beats, three work-in-progress illustrations, the original
14:45 narration, chapter-aware audio progress, and a separate grown-ups room
for the story's philosophical lineages.

Read `scaleofus-context.md` first when opening this as a fresh Codex sidebar project.

## Commands

```sh
npm install
npm run dev
npm run build
npm run build:pages
```

The story and companion notes live in `src/content/`. Work-in-progress art,
the narration waveform, and the social card live in `public/images/wind-story/`;
the compressed narration lives in `public/audio/`.

For GitHub Pages branch publishing, run `npm run build:pages`, commit the
generated `docs/` folder, then set Pages to publish from `main` and `/docs`.
