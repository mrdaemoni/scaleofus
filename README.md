# Scale of Us

Small books about big machines and the humans trying not to forget themselves.

This is the standalone site for `scaleofus.com`, built as a sibling project to At the Human Scale.

The current experience is an immersive reading and listening edition of
*The Boy Who Tried to Catch the Wind*. The nine-chapter climb holds 59
image-and-paragraph story beats: 16 original reMarkable scenes, 27 rose-gray
studies, and 16 intentional drawing placeholders. Scroll-responsive cinematic
layers, the 17:25 full-cast narration, two-way story/audio progress, and a
separate grown-ups room carry the story through a shell-pink reading ground and
clouded mountain rail.

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
