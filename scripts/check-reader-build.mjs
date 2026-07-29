import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { gzipSync } from "node:zlib";

const projectRoot = process.cwd();
const distRoot = path.join(projectRoot, "dist");
const limits = {
  readerHtml: 400 * 1024,
  readerWords: 5000,
  readerScript: 64 * 1024,
  readerStylesheet: 96 * 1024,
  audioFile: 16 * 1024 * 1024,
  liveDrawing: 512 * 1024,
  liveDrawingWire: 96 * 1024,
  liveDrawingWireTotal: 3 * 1024 * 1024,
  mobileDrawing: 128 * 1024,
  totalBuildBase: 42 * 1024 * 1024,
  additionalNarratedEdition: 32 * 1024 * 1024,
};

const failures = [];
const metrics = [];
const narratedEditionRoots = new Set();

const walk = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const absolutePath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(absolutePath) : [absolutePath];
  }));
  return nested.flat();
};

const bytesFor = async (filePath) => (await stat(filePath)).size;
const relative = (filePath) => path.relative(distRoot, filePath);
const requireBudget = (label, actual, limit) => {
  metrics.push(`${label}: ${(actual / 1024).toFixed(1)} KB / ${(limit / 1024).toFixed(1)} KB`);
  if (actual > limit) failures.push(`${label} is ${actual} bytes; budget is ${limit}.`);
};

const files = await walk(distRoot);
const htmlFiles = files.filter((filePath) => filePath.endsWith(".html"));
const readerPages = [];

for (const htmlPath of htmlFiles) {
  const html = await readFile(htmlPath, "utf8");
  if (!html.includes("data-story-app")) continue;
  readerPages.push(htmlPath);
  requireBudget(`${relative(htmlPath)} HTML`, Buffer.byteLength(html), limits.readerHtml);

  const wordCount = (html.match(/data-narration-word/g) ?? []).length;
  metrics.push(`${relative(htmlPath)} narrated words: ${wordCount} / ${limits.readerWords}`);
  if (wordCount > limits.readerWords) {
    failures.push(`${relative(htmlPath)} renders ${wordCount} word nodes; budget is ${limits.readerWords}.`);
  }
  const narrationAvailable = html.includes('data-narration-available="true"');
  if (narrationAvailable && !html.includes('preload="metadata"')) {
    failures.push(`${relative(htmlPath)} must keep narration preload at metadata.`);
  }
  if (/src="[^"]+\.gif(?:\?[^"]*)?"/i.test(html)) {
    failures.push(`${relative(htmlPath)} references a GIF; use an active SVG or static raster.`);
  }

  const storyStages = [...html.matchAll(/<article\b[^>]*\bdata-beat="[^"]+"[^>]*>/g)]
    .map((match) => {
      const tag = match[0];
      return {
        number: Number(tag.match(/\bdata-beat="([^"]+)"/)?.[1]),
        start: Number(tag.match(/\bdata-start="([^"]+)"/)?.[1]),
        end: Number(tag.match(/\bdata-end="([^"]+)"/)?.[1]),
      };
    });
  metrics.push(`${relative(htmlPath)} timed story stages: ${storyStages.length}`);
  if (!storyStages.length) {
    failures.push(`${relative(htmlPath)} has no timed story stages.`);
  } else {
    storyStages.forEach((stage, index) => {
      const expectedNumber = index + 1;
      if (stage.number !== expectedNumber) {
        failures.push(`${relative(htmlPath)} story stage ${index + 1} is numbered ${stage.number}; expected ${expectedNumber}.`);
      }
      if (!Number.isFinite(stage.start) || !Number.isFinite(stage.end) || stage.end <= stage.start) {
        failures.push(`${relative(htmlPath)} story stage ${stage.number} has invalid timing ${stage.start}-${stage.end}.`);
      }
      const previousStage = storyStages[index - 1];
      if (previousStage && stage.start <= previousStage.start) {
        failures.push(`${relative(htmlPath)} story stage ${stage.number} does not start after stage ${previousStage.number}.`);
      }
    });
  }

  const narrationParagraphs = [...html.matchAll(/<p\b[^>]*\bdata-narration-paragraph(?:="")?[^>]*>/g)]
    .map((match) => {
      const tag = match[0];
      return {
        number: Number(tag.match(/\bdata-beat-number="([^"]+)"/)?.[1]),
        start: Number(tag.match(/\bdata-start="([^"]+)"/)?.[1]),
        end: Number(tag.match(/\bdata-end="([^"]+)"/)?.[1]),
      };
    });
  metrics.push(`${relative(htmlPath)} timed narration paragraphs: ${narrationParagraphs.length}`);
  if (narrationParagraphs.length !== storyStages.length) {
    failures.push(`${relative(htmlPath)} has ${storyStages.length} story stages but ${narrationParagraphs.length} narration paragraphs.`);
  }
  narrationParagraphs.forEach((paragraph, index) => {
    const expectedNumber = index + 1;
    if (
      paragraph.number !== expectedNumber
      || !Number.isFinite(paragraph.start)
      || !Number.isFinite(paragraph.end)
      || paragraph.end <= paragraph.start
    ) {
      failures.push(`${relative(htmlPath)} narration paragraph ${expectedNumber} has invalid number or timing.`);
    }
  });

  const localAssets = [...html.matchAll(/(?:src|href|data-svg-src|data-raster-src)="(\/[^"#?]+)(?:\?[^"]*)?"/g)]
    .map((match) => match[1])
    .filter((assetPath) => !assetPath.endsWith("/"));

  for (const assetPath of new Set(localAssets)) {
    const builtPath = path.join(distRoot, assetPath.replace(/^\/+/, ""));
    try {
      const assetBytes = await bytesFor(builtPath);
      if (assetPath.endsWith(".js")) {
        requireBudget(`${relative(htmlPath)} script`, assetBytes, limits.readerScript);
      } else if (assetPath.endsWith(".css")) {
        requireBudget(`${relative(htmlPath)} stylesheet`, assetBytes, limits.readerStylesheet);
      } else if (/\.(?:mp3|m4a)$/i.test(assetPath)) {
        narratedEditionRoots.add(path.posix.dirname(assetPath));
        requireBudget(`${relative(htmlPath)} audio ${path.basename(assetPath)}`, assetBytes, limits.audioFile);
      }
    } catch {
      failures.push(`${relative(htmlPath)} references missing asset ${assetPath}.`);
    }
  }
}

if (!readerPages.length) failures.push("No built story reader page was found.");

const liveDrawingFiles = files.filter((filePath) =>
  /\/live\/[^/]+\.svg$/i.test(filePath.split(path.sep).join("/"))
);
const mobileDrawingFiles = files.filter((filePath) =>
  /\/mobile\/[^/]+\.webp$/i.test(filePath.split(path.sep).join("/"))
);
const scriptFiles = files.filter((filePath) =>
  filePath.includes(`${path.sep}_astro${path.sep}`) && filePath.endsWith(".js")
);
if (scriptFiles.length) {
  const largestScriptModule = Math.max(...await Promise.all(scriptFiles.map(bytesFor)));
  requireBudget(`largest script module (${scriptFiles.length} files)`, largestScriptModule, limits.readerScript);
}
if (liveDrawingFiles.length) {
  const liveDrawingBytes = await Promise.all(liveDrawingFiles.map(bytesFor));
  const compressedDrawingBytes = await Promise.all(liveDrawingFiles.map(async (filePath) =>
    gzipSync(await readFile(filePath), { level: 9 }).byteLength
  ));
  const largestLiveDrawing = Math.max(...liveDrawingBytes);
  const largestCompressedDrawing = Math.max(...compressedDrawingBytes);
  const totalCompressedDrawings = compressedDrawingBytes.reduce((sum, value) => sum + value, 0);
  requireBudget(`largest live drawing (${liveDrawingFiles.length} files)`, largestLiveDrawing, limits.liveDrawing);
  requireBudget("largest live drawing over the wire", largestCompressedDrawing, limits.liveDrawingWire);
  requireBudget("all live drawings over the wire", totalCompressedDrawings, limits.liveDrawingWireTotal);
  for (const filePath of liveDrawingFiles) {
    const svg = await readFile(filePath, "utf8");
    const viewBox = svg.match(/<svg\b[^>]*\bviewBox="([^"]+)"/i)?.[1]
      ?.trim()
      .split(/\s+/)
      .map(Number);
    if (
      !viewBox
      || viewBox.length !== 4
      || viewBox.some((value) => !Number.isFinite(value))
      || viewBox[2] <= 0
      || viewBox[3] <= 0
    ) {
      failures.push(`${relative(filePath)} has an invalid SVG viewBox.`);
    }
    if (/<svg\b[^>]*\bpreserveAspectRatio="[^"]*\bslice\b/i.test(svg)) {
      failures.push(`${relative(filePath)} uses a slicing aspect ratio that can crop the drawing.`);
    }
  }
}
if (mobileDrawingFiles.length) {
  const largestMobileDrawing = Math.max(...await Promise.all(mobileDrawingFiles.map(bytesFor)));
  requireBudget(`largest mobile drawing (${mobileDrawingFiles.length} files)`, largestMobileDrawing, limits.mobileDrawing);
}

const totalBuildBytes = (await Promise.all(files.map(bytesFor))).reduce((sum, value) => sum + value, 0);
const totalBuildLimit = limits.totalBuildBase
  + Math.max(0, narratedEditionRoots.size - 1) * limits.additionalNarratedEdition;
metrics.push(`narrated audio editions: ${narratedEditionRoots.size}`);
requireBudget("total deployable build", totalBuildBytes, totalBuildLimit);

console.log(metrics.join("\n"));
if (failures.length) {
  console.error(`\nReader performance budget failed:\n- ${failures.join("\n- ")}`);
  process.exitCode = 1;
} else {
  console.log(`\nReader performance budget passed for ${readerPages.length} route(s).`);
}
