# Reader reflections

The English-only form asks “Tell us what stayed with you,” followed by an
optional 1–5 star rating, an unchecked “OK to share publicly” checkbox and Submit. Checking the box reveals
an optional name-or-initials field. Unchecking clears and disables attribution.
There is no personal approval step. Previous Spanish form links open English;
the Spanish book reader is unchanged.

## Connected inbox

On October 24, 2026, Hector authorized a separate Formspree form and connection
provided it adds no charge. Created **Scale of Us — Reader reflections**:

- Public submission endpoint: `https://formspree.io/f/mkjjogvg`
- Private account dashboard: `https://formspree.io/forms/mkjjogvg/submissions`
- Notification recipient: existing verified `hello@scaleofus.com`
- Free plan; unlimited forms, 50 submissions/month shared across the account,
  and up to 30 days of submission history. No plan upgrade or payment method. Email copies are retained separately in
  the existing inbox; delivery of the full text and consent was verified there.
- Existing contact endpoint `xqpejzzr` stays separate.

Ordinary previews and future static builds send directly to this inbox. They
show the Formspree privacy link and explain that a copy is kept in our inbox. JavaScript
must initialize before submission is enabled. There are no accounts, email or relationship questions in the reader form.

The sender normalizes and validates text, records explicit boolean sharing
consent and `public-sharing-v2`, and sends a blank name when sharing is unchecked.
It sends only allowlisted fields, a request reference and a notification subject.
No words are put into URLs, browser storage, analytics or console output.
Formspree processes submissions under its own privacy policy and spam controls;
it does not inherit the local server's security or retention guarantees.

Only an explicit successful provider receipt shows “Thank you.” Rejected and
rate-limited requests preserve the words. Interrupted or ambiguous responses
warn that delivery is uncertain and never retry automatically. A request ID is
included for reconciliation; provider deduplication is not guaranteed.

## Preview and local-only sandbox

```sh
npm run build
npm run reflections:serve
```

`http://127.0.0.1:4331/reflections/` sends to the real Formspree inbox.
`http://127.0.0.1:4331/reflections/?local=1` is a separate sandbox: it explicitly
says “Local test · saved on this Mac only” and sends nothing to Formspree.
The sandbox option is honored only on loopback hosts. Automated browser tests
use this option and block external network requests. The service binds only to
loopback; do not expose it through a tunnel or reverse proxy.

The ignored `.local-reflections/` sandbox inbox remains outside static files,
with 0600 files and 0700 directories. It keeps its same-origin/session, timing,
honeypot, payload, rate, capacity, locking and idempotency checks. Private sandbox
words expire after 90 days; explicitly consented eligible words remain until
withdrawn. Local CLI list/show/export/revoke/delete/prune commands still apply
only to that sandbox, not to the Formspree inbox. Stop the service with Ctrl-C.

## Public display and release boundary

Intake does not automatically publish responses. The current public feed is
empty. Formspree intake is untrusted: there is no export/import adapter yet.
Before a future import, validate explicit current consent, discard unchecked
attribution, deduplicate and exclude every synthetic test. Never interpret
client-supplied eligibility as authority or reinterpret legacy v1 consent.

Public build data remains `src/content/public-reflections.json`. Its existing
validation rejects private, stale-consent, duplicate or digest-inconsistent
records; Astro escapes text and attribution. A website release is still needed
to change public pages, and withdrawal from a deployed quote requires replacing
that release. The October 24 follow-up authorizes deployment at
`https://scaleofus.com/reflections/`; see VERIFICATION.md for the release checks.

## Verification

```sh
npm run test:reflections
PLAYWRIGHT_MODULE=file:///Applications/ChatGPT.app/Contents/Resources/cua_node/lib/node_modules/playwright/index.mjs npm run test:reflections:browser
npm run build
```

The provider sender tests use mock receipts for success, rejection, quota errors,
malformed receipts and lost responses, including consent and attribution fields.
A clearly labelled private connection test was submitted through the actual
browser form; it must never be published as a reader review.
