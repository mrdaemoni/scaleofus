import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const [slug, ...titleParts] = process.argv.slice(2);
if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
  throw new Error("Usage: npm run new:book -- a-lowercase-slug \"The Book Title\"");
}

const title = titleParts.join(" ").trim() || slug
  .split("-")
  .map((part) => part[0].toUpperCase() + part.slice(1))
  .join(" ");
const variableName = `${slug.replace(/-([a-z0-9])/g, (_, character) => character.toUpperCase())}Book`;
const projectRoot = process.cwd();
const bookRoot = path.join(projectRoot, "src", "books", slug);
const registryPath = path.join(projectRoot, "src", "books", "index.ts");

try {
  await access(bookRoot);
  throw new Error(`Book folder already exists: src/books/${slug}`);
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
}

await mkdir(bookRoot, { recursive: true });

const files = {
  "manuscript.md": `# ${title}

*Cover — describe the cover drawing*

---

## Chapter One — ${title}

**Drawing 1 — *(describe the first landscape drawing)***

Write the first reading passage here.
`,
  "story-timings.json": "[]\n",
  "story-word-timings.json": `{
  "version": 1,
  "audioDuration": 0,
  "beats": []
}
`,
  "story-heading-timings.json": `{
  "version": 1,
  "audioDuration": 0,
  "cover": { "start": 0, "end": 0, "words": [] },
  "chapters": []
}
`,
  "reader.ts": `import type { StoryReaderConfig } from "../../lib/story-reader";

export const reader: StoryReaderConfig = {
  id: "${slug}",
  title: ${JSON.stringify(title)},
  intro: "Add the one-sentence invitation to this story.",
  narrationAvailable: false,
  audio: {
    src: "/books/${slug}/audio/narration.mp3",
    duration: 0,
  },
  artwork: {
    originalThrough: 0,
    originalRoot: "/books/${slug}/art",
    studyRoot: "/books/${slug}/art",
    sources: {},
  },
  motions: [],
  speakerStyles: {
    narrator: "narrator",
    child: "boy",
    machine: "machine",
  },
  voices: [],
};
`,
  "book.ts": `import manuscript from "./manuscript.md?raw";
import headingTimings from "./story-heading-timings.json";
import beatTimings from "./story-timings.json";
import wordTimings from "./story-word-timings.json";
import { reader } from "./reader";
import type { StoryBookSource } from "../../lib/story-book";

export const ${variableName} = {
  slug: "${slug}",
  reader,
  manuscript,
  beatTimings,
  headingTimings,
  wordTimings,
  presentation: {
    canonicalPath: "/books/${slug}/",
    navigation: { kind: "chapters" },
    chapterPalettes: [
      { wash: "#d2a7b2", secondary: "#bea8bd" },
    ],
  },
} satisfies StoryBookSource;
`,
  "README.md": `# ${title}

1. Keep the manuscript in \`manuscript.md\`.
2. Put runtime artwork in \`public/books/${slug}/art/\`.
3. Put the web narration in \`public/books/${slug}/audio/\`.
4. Set \`narrationAvailable\` to \`true\` only after word and heading timing files are complete.
5. Run \`npm run build\`; the shared reader validates this book and enforces the platform budgets.
`,
};

await Promise.all(Object.entries(files).map(([filename, contents]) =>
  writeFile(path.join(bookRoot, filename), contents, { flag: "wx" })
));

const registry = await readFile(registryPath, "utf8");
const importLine = `import { ${variableName} } from "./${slug}/book";\n`;
const withImport = registry.replace(
  /^(import .*?\n)(?=import|\n)/m,
  `$1${importLine}`,
);
const updatedRegistry = withImport.replace(
  /export const storyBooks = \[([^\]]*)\] as const;/,
  (_, entries) => {
    const currentEntries = entries.split(",").map((entry) => entry.trim()).filter(Boolean);
    return `export const storyBooks = [${[...currentEntries, variableName].join(", ")}] as const;`;
  },
);
if (updatedRegistry === registry) {
  throw new Error("Book files were created, but src/books/index.ts could not be updated automatically.");
}
await writeFile(registryPath, updatedRegistry);

console.log(`Created src/books/${slug} and added ${title} to the story registry.`);
