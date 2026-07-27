import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const sourcePath = path.resolve("public/images/wind-story/live/n01.svg");
const outputPath = path.resolve("public/images/wind-story/og-wind-drawing-01.png");

const makeStillSvg = (markup) => markup
  .replace(/\sdata-r(?=\s|>)/g, ' data-r=""')
  .replace(/<path class="grain"[^>]*\/>/g, "")
  .replace(/<g class="(?:wash )?f(?: jolt-f)?(?: live)?" data-f="[123]"[^>]*>.*?<\/g>/g, "")
  .replaceAll("var(--ink,#000)", "#65575d")
  .replaceAll("var(--live,#000)", "#65575d")
  .replaceAll('fill="#000"', 'fill="#65575d"');

const drawing = await sharp(Buffer.from(makeStillSvg(await readFile(sourcePath, "utf8"))))
  .resize({ width: 690, height: 570, fit: "inside", withoutEnlargement: false })
  .png()
  .toBuffer();

const background = Buffer.from(`
  <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <defs>
      <linearGradient id="paper" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#f7e5e8"/>
        <stop offset=".55" stop-color="#f2d9de"/>
        <stop offset="1" stop-color="#edccd5"/>
      </linearGradient>
      <radialGradient id="blush" cx=".48" cy=".5" r=".58">
        <stop offset="0" stop-color="#fff7f7" stop-opacity=".38"/>
        <stop offset="1" stop-color="#dbaeb9" stop-opacity="0"/>
      </radialGradient>
      <filter id="paper-grain" x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency=".72" numOctaves="2" seed="22"/>
        <feColorMatrix type="saturate" values="0"/>
        <feComponentTransfer>
          <feFuncA type="table" tableValues="0 .035"/>
        </feComponentTransfer>
      </filter>
    </defs>
    <rect width="1200" height="630" fill="url(#paper)"/>
    <rect width="1200" height="630" fill="url(#blush)"/>
    <rect width="1200" height="630" filter="url(#paper-grain)" opacity=".45"/>
  </svg>
`);

await sharp(background)
  .composite([{ input: drawing, gravity: "centre" }])
  .png({ compressionLevel: 9, adaptiveFiltering: true })
  .toFile(outputPath);

console.log(`Rendered ${path.relative(process.cwd(), outputPath)} from drawing 01.`);
