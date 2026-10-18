# Scale of Us publisher preview 10

The publisher preview remains at https://scaleofus.com/publisher/. The main site
now reuses these pages at the root, retaining the preview and all reader URLs.
Versions 01–09 remain preserved locally. The original drawings, manuscripts,
timings, audio, and reading addresses remain unchanged. The former root reader is available at
`/books/the-boy-who-tried-to-catch-the-wind/`, including forwarded root fragments.

## Development and publication

`npm run dev` in this directory serves the local design on port 4322.
`npm run build:publisher` from the repository root builds with Astro’s
`/publisher` base, packages only the preview into `docs/publisher/`, and rewrites
its page and edition links. Existing artwork and narration are reused from their
production paths. Original production files are checked byte for byte before
and after packaging. The usual `build:pages` command preserves this preview.

GitHub Pages publishes the committed `docs/` folder from main. This preview adds
only a separate section. Root story fragments forward to the English book reader.

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

## Local contact form and press photographs — October 17, 2026

The shared publisher layout now includes the bottom contact form on every publisher page. It is deliberately a preview: native required/email/length validation, name/email/topic/message fields and a text-only inquiry preview. It has no endpoint, mailto redirect, network request or persistent storage. The fieldset starts disabled until its script installs handlers; method=dialog prevents fallback network submission. Test with fictitious example.com details only. A valid preview never means delivery.

This is a static GitHub Pages/Astro site. No backend, SMTP integration, credentials or existing email delivery service was found. Namecheap inbound forwarding is configured but untested and is not a form-submission endpoint. Before enabling delivery, Hector must approve an existing controlled backend plus a transactional sender, or an external form-processing service/account. Confirm receiving-alias delivery separately; configure server-side validation/rate limiting and privacy handling, then perform one explicitly approved end-to-end email test. No service, secret, account, permission or payment has been added.

Press photographs come directly from src/data/photos.ts, shared with the homepage. Run node scripts/build-press-kit.mjs from the repository root to refresh the allowlisted ZIP and image manifest. Six photos are copied without modification; their byte counts, dimensions, captions and SHA-256 values are recorded. Older unrelated image assets remain preserved outside the ZIP. This does not update docs/ or deploy anything.

## Connected local Formspree revision — October 17 PDT

Hector completed signup; hello forwarding and the free endpoint https://formspree.io/f/xqpejzzr are verified by one labeled test reaching the inbox. The connected local form uses scripts/contact.ts, with no key/secret, no automatic retry, explicit-success detection, truthful uncertainty errors and duplicate protection. Run node --test scripts/test-contact.mjs for isolated mocked tests; they never send real email. One actual notification was verified at October 18 00:24:44 UTC. The public site still has the earlier non-sending preview; deploy this separate revision only after the verified release step. hola remains untested. No paid plan or expanded account grant was used.

## Verified contact-form release

The connected form is approved for publication after its single labeled local test reached the receiving inbox. Press copy and the ZIP identify hello@scaleofus.com and the public contact form. The 50/month free tier and 30-day archive apply; no API key or paid service is required. Sale/checkout remains closed. Earlier local-only notes above describe the preceding verification stage.
