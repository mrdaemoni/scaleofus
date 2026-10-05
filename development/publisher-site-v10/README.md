# Scale of Us publisher preview 10

The publisher preview is isolated at https://scaleofus.com/publisher/.
Versions 01–09 remain preserved locally. The original drawings, manuscripts,
timings, audio, production homepage, and reading addresses remain unchanged.

## Development and publication

`npm run dev` in this directory serves the local design on port 4322.
`npm run build:publisher` from the repository root builds with Astro’s
`/publisher` base, packages only the preview into `docs/publisher/`, and rewrites
its page and edition links. Existing artwork and narration are reused from their
production paths. Original production files are checked byte for byte before
and after packaging. The usual `build:pages` command preserves this preview.

GitHub Pages publishes the committed `docs/` folder from main. This preview adds
only a separate section. It does not migrate or redirect the original story.

## Design changes

The logo and subtitle are balanced as one identity. “Us” shares the original
illustration’s three-frame motion and respects reduced motion. The wind precedes
the first book’s italic title. Tabs use only the drawn underline. The original
boy and path peek above the continuing-series heading. Floating flower, sun, and
wind ornaments below the book have been removed.

The Book and Read or listen online views share the same feature. The six original
photographs retain thumbnail selection and enlargement. The optional narration
sample uses original audio and first-paragraph cues (13.66–32.48 seconds).
Selecting another format pauses playback. Inactive views are inert and hidden.

## Preview boundaries

All preview pages are noindex with analytics disabled. Checkout is not connected.
Review drafts stay in the browser; email addresses are discarded. Review quotes
awaiting permission and internal planning material are excluded. Edition facts
come from the author’s 64-page print specification. No ratings are invented.

## Verification

Twelve static pages and all local references checked. Original production files
remain unchanged. Desktop and 320/390 px layouts, selection, animation, gallery,
links, and playback are checked before publication, followed by live verification.
Proof images and local integrity reports are kept in the ignored `proof/` folder.
