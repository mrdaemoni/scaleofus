import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const distRoot = path.join(projectRoot, "dist");
const limits = {
  readerHtml: 400 * 1024,
  readerWords: 5000,
  readerScript: 64 * 1024,
  readerStylesheet: 96 * 1024,
  audioFile: 16 * 1024 * 1024,
  liveDrawing: 300 * 1024,
  mobileDrawing: 128 * 1024,
  totalBuild: 36 * 1024 * 1024,
};

const failures = [];
const metrics = [];

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
  if (!html.includes('preload="metadata"')) {
    failures.push(`${relative(htmlPath)} must keep narration preload at metadata.`);
  }
  if (/src="[^"]+\.gif(?:\?[^"]*)?"/i.test(html)) {
    failures.push(`${relative(htmlPath)} references a GIF; use an active SVG or static raster.`);
  }

  const localAssets = [...html.matchAll(/(?:src|href)="(\/[^"#?]+)(?:\?[^"]*)?"/g)]
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
  const largestLiveDrawing = Math.max(...await Promise.all(liveDrawingFiles.map(bytesFor)));
  requireBudget(`largest live drawing (${liveDrawingFiles.length} files)`, largestLiveDrawing, limits.liveDrawing);
}
if (mobileDrawingFiles.length) {
  const largestMobileDrawing = Math.max(...await Promise.all(mobileDrawingFiles.map(bytesFor)));
  requireBudget(`largest mobile drawing (${mobileDrawingFiles.length} files)`, largestMobileDrawing, limits.mobileDrawing);
}

const totalBuildBytes = (await Promise.all(files.map(bytesFor))).reduce((sum, value) => sum + value, 0);
requireBudget("total deployable build", totalBuildBytes, limits.totalBuild);

console.log(metrics.join("\n"));
if (failures.length) {
  console.error(`\nReader performance budget failed:\n- ${failures.join("\n- ")}`);
  process.exitCode = 1;
} else {
  console.log(`\nReader performance budget passed for ${readerPages.length} route(s).`);
}
