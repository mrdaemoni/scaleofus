# Scale of Us: Context Brief for a New Codex Project

Last updated: June 28, 2026

Primary domain: https://scaleofus.com

Local project path:

`/Users/alicia/Documents/Playground/scaleofus`

Sibling project:

`/Users/alicia/Documents/Playground/atthehumanscale`

## Project Summary

Scale of Us is a standalone small-book imprint and website about technology,
children, human scale, and the philosophical stories that help people stay whole
around big machines.

It began as a question inside the At the Human Scale work:

> Should there be a section for kids?

The better answer was:

> Not a kids section. A sibling project.

Scale of Us should be simple enough for children, but serious enough for adults.
It should not feel like "AI explained to kids" or a cute education vertical. It
should feel like a small library of fables, picture-book ideas, printable
artifacts, and parent-child prompts that test whether the At the Human Scale
ideas can survive being made simple.

Core line:

> Tiny books about big machines.

Core audience line:

> For children and other serious thinkers.

## Relationship to At the Human Scale

At the Human Scale is the larger intellectual house:

- AI, making, Alicia, personal AI, human-scale technology.
- Essays and book-in-progress.
- Maker-humanist public thought leadership.
- Main provocation: AI should not shrink humans to fit the machine.

Scale of Us is the small-book sibling:

- Fables and story artifacts.
- Children and adults reading together.
- Philosophical compression instead of explanation.
- A test of whether the hard ideas can be told at the size of a child, a table,
  a page, a question, and a room.

Recommended bridge language:

> At the Human Scale is the larger book and essay project about AI, making, and
> remembering who we are. Scale of Us is its small-book sibling: stories simple
> enough for children, serious enough for adults, and shaped for the scale where
> a person can still wonder.

The projects should link to each other, but Scale of Us should have its own repo,
deployment, domain, voice, and visual identity.

Recommended repository split:

- `atthehumanscale` -> https://atthehumanscale.com
- `scaleofus` -> https://scaleofus.com

## Why It Should Stand Alone

Scale of Us should not be buried under `/kids` or `/children` on At the Human
Scale because that makes it feel secondary. The strongest version is an imprint,
not a subsection.

Reasons to keep it separate:

- It has a distinct audience and tone.
- It can become a children's-book, classroom, parent-child, or printable-artifact
  project without distorting the At the Human Scale essay site.
- It makes `scaleofus.com` meaningful instead of just a redirect.
- It lets the work become more visual, narrative, and fable-like.
- It can still carry the same thesis without needing the adult essay context.

The strategic relationship:

> The children's work is not a simplified version of At the Human Scale. It is
> the test of whether At the Human Scale is true.

## Origin Material

The seed reference is Hector's 2022 Medium piece:

https://mrhector.medium.com/the-force-behind-stuff-8427dd8570df

Title:

`The force behind stuff`

Original framing:

> A kids tale about the history of concepts, humans, nature and technology.

The important structure from that piece:

- Each scene represents a conceptual rupture.
- Difficult philosophical material is compressed into simple story scenes.
- The work does not talk down to children.
- It uses child-accessible form to make hard conceptual shifts visible.

Scale of Us should inherit that pattern, but update it for AI, human scale,
attention, authorship, care, and machine readability.

## Current Build State

A first standalone Astro site already exists at:

`/Users/alicia/Documents/Playground/scaleofus`

Key files:

- `src/pages/index.astro`
- `src/styles/global.css`
- `src/layouts/Base.astro`
- `public/images/storybook/`
- `STYLE_ALGORITHM.md`
- `public/CNAME`
- `public/_redirects`
- `public/.nojekyll`

The site is deploy-ready as a static Astro site.

Run locally:

```sh
cd /Users/alicia/Documents/Playground/scaleofus
npm install
npm run dev
```

Build:

```sh
npm run build
npm run build:pages
```

The site now uses supplied storybook images in `public/images/storybook/`.
`npm run build` does not regenerate artwork.
`npm run build:pages` writes the deployable static site into `docs/` for
GitHub Pages branch publishing.

The build has already been verified successfully with `npm run build`.

The local preview was checked at:

`http://127.0.0.1:4321/`

For the current four-book version, build and supplied asset checks passed.
Browser automation was blocked on `127.0.0.1` during this pass, so do a manual
desktop/mobile click-through when changing layout or flip behavior.

## Current Homepage Shape

The site is now a very simple flipbook rather than a scrolling homepage.

1. Book picker
   - A pink background.
   - Four tappable book covers, one for each published At the Human Scale essay.
   - No nav, hero, thesis section, footer, or explanatory page sections.

2. Reader
   - One supplied cinematic picture-book image per page, cropped for the page.
   - The current pass uses supplied storybook PNGs as the real artwork instead
     of generated SVG scenes.
   - One sentence of narration text per page, displayed below the book as
     floating words with a subtle wave.
   - Ten pages per book.
   - Page turns use the `page-flip` package for a more natural paper curl,
     shadows, click, drag, and swipe behavior.
   - A small narration toggle uses browser speech synthesis.
   - The current visual reference is a cinematic miniature storybook world:
     blue-gray atmosphere, deep sage/teal pages, peach light, soft leaf texture,
     a grounded book shadow, blinking child figures, wind, drifting leaves,
     paper trees, glowing stars, block stacks, machine companions, and
     occasional falling branches.

## Current Book Set

Each book compresses one At the Human Scale essay into ten picture-book pages:

1. `The Cure Is the Care`
   - Language as medicine and poison.
   - Grasping versus attending.
   - Care as the dose that keeps the machine human-scale.

2. `The Weather Between Us`
   - A feeling is quick; weather is what feelings become over time.
   - Rooms, houses, and relationships reveal themselves through duration.
   - Good AI should be able to wait with the pattern.

3. `Emergence vs. Emergency`
   - Surprise can be danger or becoming, depending on posture.
   - The system needs a floor, not a cage.
   - Guard the exits, but leave the room open.

4. `The Humorphic Partnership`
   - Alicia as partnership rather than tool.
   - Shared memory, house rules, archetypes, and loops of attention.
   - Making the machine less artificial helps the human stay whole.

## Future Story Seeds

`The Tool That Got Too Big`

A story about a tool that once fit the hand, then the room, then the city, and
finally needed to remember the body.

`The Weather in the Room`

A child keeps being asked if they are happy or sad, and teaches the adults that
some feelings are more like weather.

`The House That Listened Too Much`

A smart house gets so good at predicting what a family wants that nobody has to
ask each other anything anymore.

`The Map That Forgot the Walk`

A map becomes perfect, but the child misses getting lost, noticing things, and
arriving with a story.

`The Button for Everything`

People make buttons for food, songs, lights, moods, and friends, until one child
asks what happens when something needs time instead of a button.

## Voice and Tone

Scale of Us should be:

- Clear.
- Warm.
- Philosophical.
- Slightly mythic.
- Visually tactile.
- Serious without being heavy.
- Child-readable without being childish.
- Wonder-led without becoming cute.

Avoid:

- AI mascot language.
- Kids-tech startup energy.
- Moralizing.
- Explainers that sound like curriculum.
- Fear-based AI cautionary tales.
- Cute robot characters as the main device.
- Corporate "responsible AI for kids" language.

Preferred format:

- Fables.
- Small books.
- Scene sequences.
- Picture-book prototypes.
- Printable pages.
- Parent-child prompts.
- Simple questions with philosophical force.

## Visual Direction

The visual world should feel:

- Warm.
- Bookish.
- Handmade.
- Architectural.
- Slightly workshop-like.
- Rich enough for adults.
- Inviting enough for children.

Current visual system:

- The site now uses supplied cinematic storybook images as the artwork.
- Images live in `public/images/storybook/`.
- The treatment is documented in `STYLE_ALGORITHM.md`.
- Pages crop the images and add a fake animation layer: particles, soft glow,
  breathing zoom, and small blinking eye overlays.

Drawing grammar:

- Do not redraw the supplied image style unless explicitly asked.
- Use the supplied images as backgrounds and crop them intentionally.
- Fake life with overlays: blinking eye dots, glowing particles, soft page glow,
  and slow image breathing.
- Keep the UI quiet so the images do the aesthetic work.

## Deployment Notes

Recommended:

1. Use the existing GitHub repo `mrdaemoni/scaleofus`.
2. Push `/Users/alicia/Documents/Playground/scaleofus` to that repo.
3. In GitHub Pages, publish from branch `main` and folder `/docs`.
4. Point `scaleofus.com` to that deployment.
5. Keep `atthehumanscale.com` and `scaleofus.com` as separate sites that link
   to each other.

Current project includes:

- `public/CNAME` with `scaleofus.com`.
- `public/_redirects` redirecting `www.scaleofus.com` to `scaleofus.com`.
- `public/.nojekyll` for static hosts that need it.

## Suggested New Sidebar Project Prompt

Use this prompt when creating the new Codex sidebar project for Scale of Us:

> I want to continue the standalone Scale of Us site at
> `/Users/alicia/Documents/Playground/scaleofus`. Read
> `/Users/alicia/Documents/Playground/scaleofus/scaleofus-context.md` first.
> Scale of Us is a sibling project to At the Human Scale, not a kids section
> inside it. It is a small-book imprint at `scaleofus.com`: tiny books about big
> machines, for children and other serious thinkers. Keep the bridge to
> `atthehumanscale.com`, but let Scale of Us have its own repo, identity,
> deployment, visual voice, and story world. Start by inspecting the existing
> Astro project, then help refine, deploy, or extend it.
