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
- `public/images/scale-of-us-hero.png`
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
```

The build has already been verified successfully with `npm run build`.

The local preview was checked at:

`http://127.0.0.1:4328/`

Desktop and mobile visual QA passed. The page has no broken hero image, no body
level horizontal overflow, and no browser console errors observed during QA.

## Current Homepage Shape

The first version includes:

1. Hero
   - "Tiny books about big machines."
   - "For children and other serious thinkers."
   - Warm generated library-workshop hero image.

2. The Wager
   - "If these ideas cannot survive being made simple, they are not yet
     human-scale."

3. First Small Book Prototype
   - `The Machine That Wanted Everyone to Be Easy to Read`

4. Scene Strip
   - Six simple beats for the first story.

5. Small Library
   - `The Machine That Wanted Everyone to Be Easy to Read`
   - `The Tool That Got Too Big`
   - `The Weather in the Room`
   - `The Force Behind Stuff`

6. Sibling Project Bridge
   - Connects Scale of Us back to At the Human Scale.

7. Principles
   - Simple is not smaller.
   - The child is not a user.
   - The machine is not the center.
   - Wonder is a form of precision.

## First Story Concept

Working title:

`The Machine That Wanted Everyone to Be Easy to Read`

Premise:

A machine is built to help people understand each other. At first it listens.
Then it sorts. Then it asks people to answer faster, choose clearer, feel
simpler, and become easier to read.

One child keeps saying:

> I am not only one thing.

That is where the story turns, and where human scale begins.

Scene beats:

1. At first, the machine learned names.
2. Then it learned faces, choices, habits, and hurry.
3. It became useful, so people gave it more of the day.
4. The machine began to ask for cleaner answers.
5. One child carried a whole weather inside and could not fit the boxes.
6. So the machine learned a smaller, better job: to help people stay whole.

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

Current hero image:

`public/images/scale-of-us-hero.png`

Generated asset prompt used:

```text
Use case: illustration-story
Asset type: website hero image for a literary children's philosophy imprint called Scale of Us
Primary request: create a warm, thoughtful children's-book style illustration about big machines and human scale.
Scene/backdrop: a quiet library-workshop at dusk with shelves, paper models, small lamps, and a large gentle abstract machine in the background shaped like nested tools and windows, not a robot.
Subject: one child and one adult standing beside a table of tiny paper houses and simple tools, looking at the large machine with curiosity rather than fear.
Style/medium: painterly editorial children's book illustration, hand-drawn texture, sophisticated but accessible, no cartoon exaggeration.
Composition/framing: wide landscape composition suitable for a website hero, with useful negative space near the left and lower center for overlay text if needed.
Lighting/mood: warm lamplight, reflective, inviting, wonder without hype.
Color palette: warm coral, ink black, soft blue, leaf green, pale paper, small accents of golden yellow; avoid a one-note beige, dark blue tech, or purple gradient palette.
Text: no text.
Constraints: no logos, no readable words, no screens dominating the scene, no sci-fi armor, no cute mascot robot, no watermark.
```

## Deployment Notes

Recommended:

1. Create a new GitHub repo called `scaleofus`.
2. Push `/Users/alicia/Documents/Playground/scaleofus` to that repo.
3. Deploy it as a static Astro site.
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

