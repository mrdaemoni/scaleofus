import { access, mkdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";

const [slug, sourceArgument] = process.argv.slice(2);

if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || !sourceArgument) {
  throw new Error(
    'Usage: npm run prepare:audio -- a-lowercase-slug "/absolute/path/to/narration.wav"',
  );
}

const source = path.resolve(sourceArgument);
const projectRoot = process.cwd();
const bookRoot = path.join(projectRoot, "src", "books", slug);
const outputRoot = path.join(projectRoot, "public", "books", slug, "audio");

await access(source);
await access(bookRoot);
await mkdir(outputRoot, { recursive: true });

const run = (command, args) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit" });
    child.on("error", (error) => {
      if (error.code === "ENOENT") {
        reject(new Error(`${command} is required but was not found on PATH.`));
        return;
      }
      reject(error);
    });
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited with status ${code}.`));
    });
  });

const mp3Path = path.join(outputRoot, "narration.mp3");
const m4aPath = path.join(outputRoot, "narration.m4a");

await run("ffmpeg", [
  "-hide_banner",
  "-loglevel",
  "warning",
  "-y",
  "-i",
  source,
  "-map_metadata",
  "-1",
  "-vn",
  "-c:a",
  "libmp3lame",
  "-b:a",
  "96k",
  "-ar",
  "44100",
  "-ac",
  "2",
  "-write_xing",
  "1",
  mp3Path,
]);

await run("ffmpeg", [
  "-hide_banner",
  "-loglevel",
  "warning",
  "-y",
  "-i",
  source,
  "-map_metadata",
  "-1",
  "-vn",
  "-c:a",
  "aac",
  "-b:a",
  "96k",
  "-ar",
  "44100",
  "-ac",
  "2",
  "-movflags",
  "+faststart",
  m4aPath,
]);

let duration = "unknown";
try {
  const chunks = [];
  await new Promise((resolve, reject) => {
    const child = spawn("ffprobe", [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      mp3Path,
    ]);
    child.stdout.on("data", (chunk) => chunks.push(chunk));
    child.on("error", reject);
    child.on("close", (code) => code === 0 ? resolve() : reject(new Error("ffprobe failed")));
  });
  duration = Number.parseFloat(Buffer.concat(chunks).toString("utf8")).toFixed(3);
} catch {
  // The web files are still valid when ffprobe is unavailable.
}

console.log(`Prepared progressive narration for ${slug}:`);
console.log(`- ${path.relative(projectRoot, mp3Path)}`);
console.log(`- ${path.relative(projectRoot, m4aPath)}`);
console.log(`- duration: ${duration} seconds`);
console.log("Copy that duration into reader.ts, then generate and verify the timing files.");
