import { access, rm } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const distRoot = path.join(projectRoot, "dist");

if (path.basename(distRoot) !== "dist" || path.dirname(distRoot) !== projectRoot) {
  throw new Error(`Refusing to prune unexpected build directory: ${distRoot}`);
}
await access(path.join(distRoot, "index.html"));

// These are authoring archives and abandoned delivery experiments. They stay
// in public/ for the illustrator and audio workflow, but never ship to readers.
// New books should place runtime files in public/books/<slug>/, which this list
// intentionally does not touch.
const authoringOnlyPaths = [
  "audio/wind-story-hls",
  "images/storybook",
  "images/wind-story/beats",
  "images/wind-story/loops",
  "images/wind-story/sketches",
  "images/wind-story/mobile/beats",
  "images/wind-story/mobile/sketches",
  "images/wind-story/og-wind.jpg",
  "images/wind-story/og-wind-pale.jpg",
  "images/wind-story/wip-mirrors.jpg",
  "images/wind-story/wip-opening.jpg",
  "images/wind-story/wip-summit.jpg",
  "scale22-loops.html",
];

await Promise.all(authoringOnlyPaths.map((relativePath) =>
  rm(path.join(distRoot, relativePath), { recursive: true, force: true })
));

console.log(`Pruned ${authoringOnlyPaths.length} authoring-only asset paths from the deployable build.`);
