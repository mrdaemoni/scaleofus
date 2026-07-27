import { mkdir, readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const sourceDirectory = path.resolve("public/images/wind-story/live");
const outputDirectory = path.resolve("public/images/wind-story/mobile");

const makeMobileSvg = (markup) => markup
  .replace(/\sdata-r(?=\s|>)/g, ' data-r=""')
  .replace(/<path class="grain"[^>]*\/>/g, "")
  .replace(/<g class="(?:wash )?f(?: jolt-f)?(?: live)?" data-f="[123]"[^>]*>.*?<\/g>/g, "")
  .replaceAll("var(--ink,#000)", "#6f6165")
  .replaceAll("var(--live,#000)", "#6f6165")
  .replaceAll('fill="#000"', 'fill="#6f6165"');

await mkdir(outputDirectory, { recursive: true });
const sources = (await readdir(sourceDirectory))
  .filter((name) => /^(?:n\d{2}|ch-[a-z]+|icon-(?:book|play)|title|fin)\.svg$/.test(name))
  .sort();

let totalBytes = 0;
for (const sourceName of sources) {
  const sourcePath = path.join(sourceDirectory, sourceName);
  const outputPath = path.join(outputDirectory, sourceName.replace(/\.svg$/, ".webp"));
  const svg = makeMobileSvg(await readFile(sourcePath, "utf8"));
  await sharp(Buffer.from(svg))
    .resize({ width: 640, height: 640, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 80, alphaQuality: 92, smartSubsample: true, effort: 6 })
    .toFile(outputPath);
  totalBytes += (await stat(outputPath)).size;
}

console.log(`Rendered ${sources.length} transparent mobile drawings (${Math.round(totalBytes / 1024)} KB).`);
