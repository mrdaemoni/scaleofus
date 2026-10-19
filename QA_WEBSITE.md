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

## Follow-up: simple About page and horizon footer (local, awaiting publication)

The About page now has three short paragraphs centered on finding our bearings
with AI, making ideas from thinkers and philosophers accessible through stories,
and noticing something new on each reading. It follows the Hector writing skill:
one thesis, plain language, a concrete story example, and an invitation to
inquiry. The biography, book-format tour, photo and section navigation have been
removed. Existing About fragment targets remain available for old links.

The boy-and-machine drawing accompanies the copy. The shared footer now uses a
smooth, drawn horizon between light paper and darker pink, with the existing
mountain/town drawing spanning it. Footer navigation contains only About. The book
page's former Meet the author link now says About Scale of Us and opens the
simplified publisher page. Root and `/publisher/` share all of these changes.

Validation: production build and reader budgets passed. 24 browser cases cover
home/About, root/publisher, 320/390/1440px widths, reduced motion on/off, content,
footer destinations, touch target, horizontal overflow and page errors. All
1,733 local HTML/CSS references pass. Screenshots were visually inspected.
Evidence: `development/publisher-site-v10/proof/about-and-horizon/` (ignored).
These changes and the preceding bilingual-entry revision remain unpublished.

## Follow-up: perspective and source notes (local, awaiting publication)

The repeated footer logo/tagline block is removed. The horizon caption now reads
“Scale for humans. A wider view.” The homepage publisher section introduces
“A publishing house for human questions.” About explains scale as gaining
perspective and a reread as a chance to see a question differently.

A numbered source reference follows “thinkers and philosophers.” A small note
after the final paragraph identifies six authors/works already listed in the
first story’s canonical reading notes: Alfred Korzybski, Martin Buber, Michael
Polanyi, Zhuangzi, Simone Weil, and T. S. Eliot. The note explicitly names the
first story, links to the full notes, and provides a return link. It does not
claim these sources for unpublished stories. Hector’s writing skill was applied.

Root and `/publisher/` share these changes. The header wordmark and existing
story/artwork remain intact. The color boundary remains free of an outline.

Validation: `npm run build:pages` passed all reader budgets. Twelve browser
cases cover home/About, root/publisher, and 320/390/1440px layouts. Keyboard
source/reference navigation, source text, both full-reading-note destinations,
footer links and overflow passed. All 1,703 local references pass, as does
`git diff --check`. Screenshots were visually reviewed. Evidence is saved in
`development/publisher-site-v10/proof/publisher-perspective/` (ignored).
This revision has not been pushed or deployed.

## Follow-up: one-row phone entrances and About cleanup (approved for publication)

The attached screenshots identify the three format/language entrances, the
repeated About tagline, and the bibliography return-arrow glyph. Book, English,
and Spanish now stay on one horizontal row on phones. Below 361px the visible
labels omit “online” and “en línea”; full accessible names and both destinations
remain intact. All controls retain at least 48px height, legible 11px labels,
matching play icons and reduced-motion behavior.

About keeps its logo and a small semantic “About Scale of Us” h1. The large
repeated tagline is removed. The bibliography's visible arrow is replaced by a
screen-reader-accessible return link that appears as descriptive text on keyboard
focus. The numbered reference and full reading-notes link are preserved.

`npm run build:pages` passes all reader budgets. Twelve cases cover root and
publisher pages at 320/360/375/390/430/1440px, one-row geometry, overflow, keyboard
format/source navigation, matching animation reduction, and About content.
Both English and Spanish destinations were followed at 320px in both sections.
All 1,703 local references pass. Screenshots were visually reviewed. Evidence:
`development/publisher-site-v10/proof/phone-entry-row/` (ignored).
The user explicitly authorized publishing this revision for phone testing.

## Follow-up: About opening and direct English reader (local, awaiting publication)

About begins with the exact requested paragraph: “We are learning to live with
each other. We’re learning to live with AI. We need stories that help us find our
bearings: who we are, what matters to us, and how we live together.”

The English entrance is now a normal direct link, matching Spanish:
- Root: `/immerse/wind/` (English), `/immerse/es/` (Spanish).
- Publisher: `/publisher/immerse/wind/` (English), `/publisher/immerse/es/` (Spanish).

The on-page English sample/alternate panel, its audio element, and sample player
logic are removed. All three entrances are now links. Book opens the existing
printed-book panel. Old `#reading` and `#digital-panel` bookmarks on pages that
used the removed panel forward to that section’s English immersive reader.
Manual `/read/wind/` and `/read/es/` URLs, their publisher equivalents, book
readers, artwork, narration, and chapter bookmarks remain available.

Validation: build and reader budgets pass. Twelve new desktop/mobile cases cover
root/publisher home/book pages, direct language links, one-row layout, keyboard
navigation, and English/Spanish narration starting and pausing. Exact About copy,
legacy fragment redirects and manual reader URLs pass. The existing 16-case
reader suite passes, including all chapters, pause/resume, reduced motion and
old root chapter bookmarks. All 1,691 local references pass. Evidence:
`development/publisher-site-v10/proof/direct-english-reader/` (ignored).
No push or deployment is authorized for this follow-up.


## Music-free narration release — October 19, 2026

The English v17 and Spanish v1 original pre-score masters were recovered and directly encoded as the existing progressive MP3 and fast-start M4A assets. No separation model, voice regeneration, new music, trimming, time stretching or narrator muting was used. Procedurally generated scene ambience remains. Master and web durations agree within 0.00002 seconds, so all heading/beat/word timings remain unchanged. Both source masters remain untouched; the previous four web files and detailed checksum/sample audit are preserved privately outside the deployed build.

Validation: 24 full-decoded sample comparisons across both languages and formats exceed .98 source correlation with at most a few samples of codec alignment; narration signal is non-silent. At 390px both readers play unmuted, advance their media clock, highlight words, pause/resume and seek to all seven existing chapter targets. Build budgets and all 1,827 local references pass. Only four compressed narration files are in docs; legacy HLS is excluded. Existing audio paths remain, with new music-free cache versions, preserving old links and the award-entry URLs. Press notes and ZIP describe current narration/ambience without a music soundtrack. Competition submissions are unchanged.
