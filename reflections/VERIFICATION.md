# Simple reader reflections — latest verification

## Public release — October 24, 2026

Hector authorized public deployment of the connected reflections form and an
optional 1–5 star selector. Stars highlight on hover, expose star-count labels,
support arrow keys, and can be cleared. Explicit sharing still starts unchecked;
attribution is cleared when unchecked. The public feed starts empty.

The provider's 30-day dashboard history is separate from the full submission
emails delivered to the existing inbox. The earlier private connection test's
text and consent arrived by email, so the form now says “We keep a copy in our
inbox.” No paid upgrade or new retention service was added. The shared Free-plan
monthly submission allowance remains 50.

Release checks: 12 policy/provider tests, 14 root/publisher browser cases at
320/390/1440 pixels, the isolated public-feed validation build, all reader
budgets, and 1,883 local HTML/CSS references passed. No checkout prototype or
unrelated authoring work is included. Existing media remain byte-for-byte.
Public destination: `https://scaleofus.com/reflections/`.

## Formspree connection — October 24, 2026

Created the separate Reader reflections form on the verified Free plan,
endpoint `https://formspree.io/f/mkjjogvg`, with existing verified notification
recipient `hello@scaleofus.com`. Billing showed no payment method. Initial
account usage was 1/50; forms share the monthly allowance. No upgrade or charge.
The ordinary preview now sends to Formspree; `?local=1` on loopback retains the
isolated local sandbox. The browser form received a successful provider receipt
for the explicit private `TEST ONLY — SOU-REFLECTIONS-20261024` connection check.
The dedicated Formspree dashboard also confirmed that record, a blank name,
`quoteConsent: false`, and `public-sharing-v2`.
All 11 policy/provider tests and 10 local sandbox browser cases passed;
root and publisher builds and reader budgets passed, as did `git diff --check`.
No website deployment or public-feed import was performed. Older limitations
below describe the previous local-only implementation.

## Current follow-up: English only

The reflections page and its entrances are English-only for now, with no language
picker. Previous Spanish form URLs redirect to English; Spanish book readers
remain unchanged. All 13 updated browser cases pass, as do the root/publisher
builds, reader budgets, isolated public-feed build and 1,879 local references
with zero broken links. Updated screenshots/results are under
`evidence/english-only/` in the delegated task. The local preview is running at
`http://127.0.0.1:4331/reflections/`; refresh its tab to load the English-only page.
Nothing was deployed. The earlier verification below records the preceding
bilingual revision of the same consent behavior.

This revision implements Hector's explicit request to replace the earlier
personal-review design with a simple reader-controlled sharing choice.

## Implemented

- English “Tell us what stayed with you” and matching Spanish prompt.
- Text field, unchecked “OK to share publicly,” conditional optional name/initials,
  Submit and a simple thank-you. The extra contact form and explanatory workflow
  are removed from this page.
- Checking reveals attribution. Unchecking clears and disables it. The server
  independently discards attribution without consent, including forged input.
- Explicit v2 sharing consent makes a response public-eligible without personal
  review. Unchecked responses remain private. There is no approve command.
- Old v1 test records remain excluded under their original consent expectations.
- Existing validation, escaping, same-origin/session safeguards, spam controls,
  private storage and idempotent local retries remain behind the scenes.
- Initial public feed is empty. No test responses or invented endorsements were
  exported into the real site build.

## Final checks

| Check | Result |
|---|---|
| Reflection policy, CLI maintenance, HTTP security, existing checkout/Stripe | 32 passed |
| New bilingual root/publisher browser suite | 19 passed; no page errors |
| Root Astro production build and six reader route budgets | Passed |
| Separate publisher packaging | 15 pages; 240 main-build files unchanged |
| Combined local references | 1,889 checked; zero broken |
| Isolated public-feed fixture build | Consented reflection renders without personal approval; unchecked words excluded; HTML escaped; changed consent record rejected |
| Git whitespace check | Passed |

Browser checks cover root/publisher English/Spanish at 320, 390 and 1440 pixels;
consent toggling both ways; conditional attribution visibility, clearing and
optional blank attribution; private vs public eligibility; rapid repeats,
refresh and lost-response retry; simple thank-you; disabled unconfigured
collection/no JavaScript; and existing book/checkout entrances. All stored test
words are explicitly synthetic and their disposable inboxes were removed.
Mobile validation uses Chrome emulation, not a physical Safari/iPhone test.

Screenshots and results are under the delegated task's
`evidence/simple-reflections/`. The isolated combined preview is
`site-preview-simple/`. The standard repository `dist/` also has the latest build.
The local server was restarted on the existing URL:
`http://127.0.0.1:4331/reflections/` (Spanish `/es/reflections/`). Refresh the tab
to load the new form. A live HTTP check confirmed the simple heading, sharing
label, hidden initial attribution, no personal-review wording and no second
contact form.

## Remaining limitation

Formspree account plan/quota and a separate reflections endpoint have not been
provided or verified. No production Formspree adapter/export-import is wired.
The preview talks only to its loopback service and explicitly says it is a local
test saved on this Mac. GitHub Pages cannot receive/store submissions itself.
Unconfigured collection stays disabled in a static public build.

No deployment, publishing, paid service, persistent credentials, security setting
changes or contact messages occurred. `docs/`, reader/audio code and canonical
book facts were preserved. Local consent eligibility does not authorize a site
release or turn local test words into real testimonials.
