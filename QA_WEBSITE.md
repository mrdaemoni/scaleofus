# Website improvements: local review

Branch: `fix/reader-and-publisher-home`.

## Implemented

- The publisher landing page is now `/`, using the same v10 components. New root
  publisher routes share those sources. Existing `/publisher/`, its English and
  Spanish `/read/` and `/immerse/` routes, `/es/`, `/books/`, `/library/`, narration,
  and artwork paths remain available.
- Old root story/chapter/beat fragments forward to the English book reader with
  query and fragment preserved. The English edition's canonical/language links
  point to that reader rather than the new landing page.
- “Lee o escucha en línea” sits beside “Read or listen online” and opens the
  Spanish immersive reader. Immersive reading is secondary to the book landing.
- Dock Play resumes its media position. Only the cover Listen entry restarts.
  The old code used scroll position after entering the fixed mobile stage, which
  scrolls to zero and therefore incorrectly selected the restart path.
- All 56 finished illustrations were visually reviewed. Each now has its own
  description in English and Spanish, separate from unchanged manuscript prompts.
  Descriptions also cover the fallback if artwork cannot load.
- Spanish player labels, seeking text, chapter navigation, and book-return links
  are localized. Reading navigation includes a Listen action that resumes the
  selected chapter. Expanded controls offer manual reading and return to start.
- Playback, expand, seek and chapter controls have targets at least 44px tall.
  Skip links, focus indicators, inert hidden navigation and reduced-motion
  behavior improve keyboard and mobile access.
- Publisher packaging snapshots actual generated files, including changed hashed
  bundles, before checking that packaging leaves the main build untouched.
  Shared CSS media URLs retain their original root paths.

## Verification

Final result: **16 browser checks passed**, **1,789 local references checked
with zero broken links**, and `git diff --check` passed. `npm run build:pages`
passed all six main reader route budgets and rebuilt all twelve publisher pages.
Publisher packaging verified that 210 files outside its directory stayed
unchanged. No manuscript, narration, or artwork file changed.

Evidence is saved locally under
`development/publisher-site-v10/proof/website-improvements/` (ignored by Git),
including desktop/mobile screenshots, browser results, link results and build log.


`npm run build:pages` runs manuscript/timing validation, asset pruning and all
reader performance budgets, then regenerates both the main site and publisher
section. `python3 scripts/check-site-links.py` checks local HTML and CSS references.

`scripts/test-reader-browser.mjs` uses Playwright with installed Chrome against
`QA_BASE_URL` (default `http://127.0.0.1:4323`). Serve generated `docs/` with a
server supporting audio byte ranges. Set `PLAYWRIGHT_MODULE` to an installed
Playwright module URL if it is not available through normal package resolution.
For this Mac's bundled runtime:

```sh
PLAYWRIGHT_MODULE=file:///Applications/ChatGPT.app/Contents/Resources/cua_node/lib/node_modules/playwright/index.mjs node scripts/test-reader-browser.mjs
```

Screenshots and machine-readable results default to `/tmp/scaleofus-qa/` and can
be redirected with `QA_OUTPUT`. The suite covers English/Spanish at 390×844 with
and without reduced motion, all seven chapters, paused and playing chapter
switches, keyboard controls, touch targets, artwork descriptions, landing pages
at 320/390/1440px, old root fragments, desktop playback, manual readers and skip
links. It blocks external HTTPS requests during local QA.

Before the fix, the Spanish chapter-4 sequence reproduced locally at 547.52s,
then reset to 0.77s and `#top`. After the fix it resumed at 547.93s with the
chapter fragment intact. The English sequence resumes near 501.98s.

## Publication boundary

No push or deployment is authorized by this task. GitHub Pages publishes `main`
and `/docs`; publishing requires review of this branch and explicit approval to
merge/push its source and generated output. No award submissions or fees occur.
Checkout remains the existing preview behavior. Browser QA uses desktop Chrome
mobile emulation; a physical iPhone/Safari listening pass remains advisable before
publishing. No AGENTS.md or additional software-engineering skill was found in
the repository/ancestor directories; README and STORY_READER_TEMPLATE guidance
were followed. Pre-existing untracked authoring files were left untouched.

## Follow-up: bilingual entrance presentation (local, awaiting publication)

Branch `fix/bilingual-entry-presentation` adds a matching drawn, gently pulsing
play icon to the Spanish entrance. Both entrances share typography, spacing,
icon size, focus treatment and reduced-motion behavior. Spanish text is not
underlined. On mobile, both language entrances stay side by side beneath Book;
the English format tab and Spanish reader destination keep their behavior.

The shared Reviews & reader responses link has been removed. No generated page
links to `#reviews` or offers a Read the responses link; the existing review
section anchor remains intact for old bookmarks. Printing-count references have
been removed from the shared edition description/details, About, Help, Press,
and downloadable information sheet, in both root and publisher output. The
English print-language fact and other book specifications remain unchanged.

Verification: `npm run build:pages` passes all performance and content budgets;
12 browser cases cover root and `/publisher/` at 320, 390 and 1440 pixels with
reduced motion on/off, matching icons/styles, side-by-side layout, keyboard
activation/focus, both language destinations, no horizontal overflow, and no
page errors. All generated HTML and information sheets were scanned for removed
wording and review links. 1,785 local HTML/CSS references pass with no broken
links. `git diff --check` passes.

Screenshots and logs: `development/publisher-site-v10/proof/bilingual-entry-revision/`
(ignored local evidence). No push or deployment is authorized for this follow-up;
publication requires a fresh confirmation. Hector reports that the earlier live
reader fixes work on his phone; this follow-up was checked in Chrome emulation.
