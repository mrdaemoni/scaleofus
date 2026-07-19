import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const sourcePath = path.join(root, "artwork/incoming/Scale 1 - page 1.svg");
const chapterOneV2Path = path.join(root, "artwork/incoming/chapter-01-v2-page-09.svg");
const scale22Path = path.join(root, "artwork/incoming/scale-22-page-01.svg");
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
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: fitted, gravity: "center" }])
    .png({ compressionLevel: 9, palette: true, quality: 94 })
    .toFile(path.join(outputDir, file));
}

const chapterOneV2Source = await readFile(chapterOneV2Path, "utf8");
const chapterOneV2Drawing = chapterOneV2Source.replace(/<image\b[^>]*?\/>/s, "");
const chapterOneV2Rendered = await sharp(Buffer.from(chapterOneV2Drawing), { limitInputPixels: false })
  .png()
  .toBuffer();
const chapterOneV2Trimmed = await sharp(chapterOneV2Rendered)
  .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 1 })
  .png()
  .toBuffer();
const chapterOneV2Metadata = await sharp(chapterOneV2Trimmed).metadata();
const chapterOneV2Mask = await sharp(chapterOneV2Trimmed)
  .extractChannel("alpha")
  .linear(0.76)
  .png()
  .toBuffer();
const chapterOneV2Ink = await sharp({
  create: {
    width: chapterOneV2Metadata.width,
    height: chapterOneV2Metadata.height,
    channels: 3,
    background: "#5f5358",
  },
})
  .joinChannel(chapterOneV2Mask)
  .png()
  .toBuffer();

const chapterOneV2Variants = [
  // The chapter begins with the whole figure, then moves through tactile
  // details before returning to the complete departure scene in beat eight.
  { number: 1, crop: { left: 0, top: 0, width: 2700, height: 2000 } },
  { number: 2, crop: { left: 560, top: 1790, width: 980, height: 1040 } },
  { number: 3, crop: { left: 90, top: 120, width: 2510, height: 1580 } },
  { number: 4, crop: { left: 790, top: 1990, width: 700, height: 830 } },
  { number: 5, crop: { left: 1190, top: 1810, width: 1960, height: 1020 } },
  { number: 6, crop: { left: 0, top: 0, width: 3010, height: 660 } },
  { number: 7, crop: { left: 850, top: 430, width: 1760, height: 1730 } },
];

for (const variant of chapterOneV2Variants) {
  const detail = variant.crop
    ? await sharp(chapterOneV2Ink).extract(variant.crop).png().toBuffer()
    : chapterOneV2Ink;
  const fitted = await sharp(detail)
    .resize({
      width: 1120,
      height: 720,
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
  const file = `chapter-01-v2-beat-${String(variant.number).padStart(2, "0")}.png`;
  await sharp({
    create: {
      width: 1200,
      height: 800,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: fitted, gravity: "center" }])
    .png({ compressionLevel: 9, palette: true, quality: 94 })
    .toFile(path.join(outputDir, file));
}

const chapterOneCoverFigure = await sharp(chapterOneV2Ink)
  .resize({
    width: 440,
    height: 380,
    fit: "contain",
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .png()
  .toBuffer();

await sharp({
  create: {
    width: 1600,
    height: 1000,
    channels: 4,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  },
})
  .composite([{ input: chapterOneCoverFigure, left: 1080, top: 500 }])
  .png({ compressionLevel: 9, palette: true, quality: 94 })
  .toFile(path.join(outputDir, "chapter-01-v2-cover.png"));

const chapterOneV2Fitted = await sharp(chapterOneV2Ink)
  .resize({
    width: 1120,
    height: 720,
    fit: "contain",
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .png()
  .toBuffer();

await sharp({
  create: {
    width: 1200,
    height: 800,
    channels: 4,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  },
})
  .composite([{ input: chapterOneV2Fitted, gravity: "center" }])
  .png({ compressionLevel: 9, palette: true, quality: 94 })
  .toFile(path.join(outputDir, "beat-08-leaving-town-v2.png"));

const scale22Source = await readFile(scale22Path, "utf8");
const scale22Drawing = scale22Source.replace(/<image\b[^>]*?\/>/s, "");
const scale22Rendered = await sharp(Buffer.from(scale22Drawing), { limitInputPixels: false })
  .ensureAlpha()
  .png()
  .toBuffer();

async function scale22Ink({ top, bottom, left = 0, width = 1620 }) {
  const extracted = await sharp(scale22Rendered)
    .extract({ left, top, width, height: bottom - top })
    .png()
    .toBuffer();
  const crop = await sharp(extracted)
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 1 })
    .png()
    .toBuffer();
  const metadata = await sharp(crop).metadata();
  const mask = await sharp(crop)
    .extractChannel("alpha")
    .linear(0.76)
    .png()
    .toBuffer();
  return sharp({
    create: {
      width: metadata.width,
      height: metadata.height,
      channels: 3,
      background: "#5f5358",
    },
  })
    .joinChannel(mask)
    .png()
    .toBuffer();
}

async function writeScale22Frame(ink, filename) {
  const fitted = await sharp(ink)
    .resize({
      width: 1120,
      height: 720,
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
  await sharp({
    create: {
      width: 1200,
      height: 800,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: fitted, gravity: "center" }])
    .png({ compressionLevel: 9, palette: true, quality: 94 })
    .toFile(path.join(outputDir, filename));
}

const scale22StoryCrops = [
  { number: 1, top: 883, bottom: 1879 },
  { number: 2, top: 1896, bottom: 2751 },
  { number: 3, top: 2747, bottom: 3601 },
  { number: 4, top: 3663, bottom: 4443 },
  { number: 5, top: 4537, bottom: 5397 },
  { number: 6, top: 5447, bottom: 6261 },
  { number: 7, top: 6360, bottom: 7120 },
  { number: 8, top: 7171, bottom: 8296 },
  { number: 9, top: 8424, bottom: 9479 },
  // Source page 11 is a three-moment composition. Splitting it preserves the
  // site's one-landscape-per-paragraph rhythm without redrawing the artwork.
  { number: 10, top: 9624, bottom: 10500 },
  { number: 11, top: 10470, bottom: 11446 },
  { number: 12, top: 11493, bottom: 12369 },
  { number: 13, top: 12515, bottom: 13134 },
  { number: 14, top: 13364, bottom: 14128 },
  { number: 15, top: 14163, bottom: 14860 },
  { number: 16, top: 14964, bottom: 15675 },
];

for (const crop of scale22StoryCrops) {
  const ink = await scale22Ink(crop);
  const filename = `scale-22-beat-${String(crop.number).padStart(2, "0")}.png`;
  await writeScale22Frame(ink, filename);
}

const scale22CoverWind = await scale22Ink({ top: 20, bottom: 790 });
const scale22CoverBoy = await scale22Ink({
  left: 450,
  width: 720,
  top: 970,
  bottom: 1835,
});
const scale22CoverWindFitted = await sharp(scale22CoverWind)
  .resize({
    width: 760,
    height: 330,
    fit: "contain",
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .png()
  .toBuffer();
const scale22CoverBoyFitted = await sharp(scale22CoverBoy)
  .resize({
    width: 420,
    height: 390,
    fit: "contain",
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .png()
  .toBuffer();

await sharp({
  create: {
    width: 1600,
    height: 1000,
    channels: 4,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  },
})
  .composite([
    { input: scale22CoverWindFitted, left: 720, top: 155 },
    { input: scale22CoverBoyFitted, left: 1100, top: 490 },
  ])
  .png({ compressionLevel: 9, palette: true, quality: 94 })
  .toFile(path.join(outputDir, "scale-22-cover.png"));

console.log(`Rendered ${scenes.length} storyboard sketches, the V2 study, and 16 Scale 22 story frames.`);
