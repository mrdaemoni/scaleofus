# Book registry

`index.ts` is the single catalog for the site. Add books with:

```sh
npm run new:book -- a-lowercase-slug "The Book Title"
```

Keep one book's manuscript, reader configuration, and timing JSON inside its
own folder. Put browser-delivered artwork and narration under
`public/books/<slug>/`. The shared `/books/[slug]` route and `/library/` page
derive from the registry; do not create per-book page components or duplicate
catalog metadata.

See the repository's `STORY_READER_TEMPLATE.md` for the complete contract.
