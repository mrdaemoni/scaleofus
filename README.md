# Scale of Us

Small books about big machines and the humans trying not to forget themselves.

This is the standalone site for `scaleofus.com`, built as a sibling project to At the Human Scale.

The current experience is the v10 final proof of *The Boy Who Tried to Catch
the Wind*. The seven-chapter climb holds 56 image-and-paragraph story beats.
Twenty-four mapped scenes and the cover use live vector drawings with a quiet
sketch-on reveal and line boil; the remaining beats keep their drawing prompts
as placeholders. The v15 scored narration is aligned word by word for the
follow-along listening experience.

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
The command copies the fresh site over `docs/` without deleting separate local
experiments that may also live there.
