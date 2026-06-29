# Scale of Us

Small books about big machines and the humans trying not to forget themselves.

This is the standalone site for `scaleofus.com`, built as a sibling project to At the Human Scale.

The current experience is a simple touch-first flipbook: pick one of four small
essay books, then move forward or backward one page at a time. Each book has ten
picture pages, supplied cinematic storybook images, a PageFlip-powered paper
turn, and narration words floating below the book.

Read `scaleofus-context.md` first when opening this as a fresh Codex sidebar project.

## Commands

```sh
npm install
npm run dev
npm run build
npm run build:pages
```

The site uses supplied storybook images in `public/images/storybook/`. Pages crop
those images and add a lightweight overlay for blinking eyes, glowing particles,
and subtle breathing motion.

For GitHub Pages branch publishing, run `npm run build:pages`, commit the
generated `docs/` folder, then set Pages to publish from `main` and `/docs`.
