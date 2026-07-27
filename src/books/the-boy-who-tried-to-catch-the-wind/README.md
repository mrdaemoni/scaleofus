# The Boy Who Tried to Catch the Wind

The authored animation pipeline lives in:

`/Users/alicia/Documents/mrhector-alicia/writing/The Boy Who Tried to Catch the Wind/reader-prototype/`

Read its `INTEGRATION.md` before updating the site. The production SVGs mirror
`site/theboy/*.svg` into `public/images/wind-story/live/`; then
`npm run render:mobile-drawings` makes the lightweight reading-mode stills.

Story files `n01.svg` through `n56.svg` map directly to beat numbers. Beats 2
and 6 intentionally have no drawing. Chapter-transition drawings and `fin.svg`
are configured separately in `reader.ts`.
