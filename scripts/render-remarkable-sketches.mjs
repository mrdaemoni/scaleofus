import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const sourcePath = path.join(root, "artwork/incoming/Scale 1 - page 1.svg");
const outputDir = path.join(root, "public/images/wind-story/sketches");
const source = await readFile(sourcePath, "utf8");
const drawingOnly = source.replace(/<image\b[^>]*?\/>/s, "");
const renderedSource = await sharp(Buffer.from(drawingOnly), { limitInputPixels: false })
  .png()
  .toBuffer();

const scenes = [
  { number: 1, x: -675, y: 0, width: 1350, height: 875 },
  { number: 2, x: -600, y: 1710, width: 1300, height: 700 },
  { number: 3, x: -720, y: 2500, width: 1440, height: 850 },
  { number: 4, x: -810, y: 3560, width: 1620, height: 1000 },
  { number: 5, x: -650, y: 4980, width: 1300, height: 650 },
  { number: 6, x: -700, y: 5740, width: 1350, height: 900 },
  { number: 7, x: -700, y: 7230, width: 1350, height: 690 },
  { number: 8, x: -700, y: 8300, width: 1350, height: 580 },
  { number: 9, x: -700, y: 9000, width: 1350, height: 700 },
  { number: 10, x: -700, y: 9910, width: 1350, height: 700 },
  { number: 11, x: -471, y: 10720, width: 942, height: 628 },
];

await mkdir(outputDir, { recursive: true });

for (const scene of scenes) {
  const left = scene.x + 810;
  const crop = await sharp(renderedSource)
    .extract({ left, top: scene.y, width: scene.width, height: scene.height })
    .ensureAlpha()
    .png()
    .toBuffer();
  const mask = await sharp(crop)
    .extractChannel("alpha")
    .linear(0.76)
    .png()
    .toBuffer();
  const ink = await sharp({
    create: {
      width: scene.width,
      height: scene.height,
      channels: 3,
      background: "#5f5358",
    },
  })
    .joinChannel(mask)
    .png()
    .toBuffer();
  const fitted = await sharp(ink)
    .resize({
      width: 1120,
      height: 720,
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
  const file = `beat-${String(scene.number).padStart(2, "0")}.png`;
  await sharp({
    create: {
      width: 1200,
      height: 800,
      channels: 4,
      background: "#f1dadd",
    },
  })
    .composite([{ input: fitted, gravity: "center" }])
    .png({ compressionLevel: 9, palette: true, quality: 94 })
    .toFile(path.join(outputDir, file));
}

console.log(`Rendered ${scenes.length} self-contained story sketches.`);
