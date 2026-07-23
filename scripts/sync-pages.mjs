import { access, cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const distRoot = path.join(projectRoot, "dist");
const pagesRoot = path.join(projectRoot, "docs");

if (
  path.basename(distRoot) !== "dist"
  || path.basename(pagesRoot) !== "docs"
  || path.dirname(distRoot) !== projectRoot
  || path.dirname(pagesRoot) !== projectRoot
) {
  throw new Error("Refusing to sync unexpected build paths.");
}
await access(path.join(distRoot, "index.html"));

// docs/ is generated deployment output. Replacing it prevents stale hashed
// bundles and old experiments from accumulating across book releases.
await rm(pagesRoot, { recursive: true, force: true });
await mkdir(pagesRoot, { recursive: true });
await cp(distRoot, pagesRoot, { recursive: true });

console.log("Synced the validated deployable build to docs/.");
