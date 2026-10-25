import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = path.join(root, 'development/publisher-site-v10');
const docs = path.join(root, 'docs');
const target = path.join(docs, 'publisher');
const dist = path.join(source, 'dist');
const shared = new Set(['audio', 'images', 'books']);
// Snapshot the actual build, whose hashed bundle names can change after sync-pages.
// Include new files as well as tracked files, excluding only the preview we replace.
async function productionFiles(directory = docs) {
  const result = [];
  for (const entry of await readdir(directory, {withFileTypes:true})) {
    const file = path.join(directory, entry.name);
    if (file === target) continue;
    result.push(...(entry.isDirectory() ? await productionFiles(file) : [file]));
  }
  return result.sort();
}
const protectedFiles = await productionFiles();
async function hashes() {
  const files = await productionFiles();
  return Object.fromEntries(await Promise.all(files.map(async file =>
    [path.relative(root,file), createHash('sha256').update(await readFile(file)).digest('hex')])));
}
const before = await hashes();
execFileSync('npm', ['run', 'build'], {
  cwd:source, stdio:'inherit', env:{...process.env, PUBLISHER_PUBLIC_PREVIEW:'1'}
});
// Only this separate generated preview directory is replaced.
await rm(target, {recursive:true, force:true});
await mkdir(target, {recursive:true});
for(const entry of await readdir(dist, {withFileTypes:true})) {
  if(shared.has(entry.name)) continue;
  await cp(path.join(dist,entry.name), path.join(target,entry.name), {recursive:true});
}
async function walk(directory) {
  const result=[];
  for(const entry of await readdir(directory,{withFileTypes:true})) {
    const file=path.join(directory,entry.name);
    result.push(...(entry.isDirectory() ? await walk(file) : [file]));
  }
  return result;
}
const files=await walk(target);
// Astro adds its base to CSS URLs, but shared media live at their original root paths.
for (const file of files.filter(file => file.endsWith('.css'))) {
  const css = await readFile(file, 'utf8');
  await writeFile(file, css.replace(/\/publisher\/(images|audio|books)\//g, '/$1/'));
}
for(const file of files.filter(file=>file.endsWith('.html'))) {
  let html=await readFile(file,'utf8');
  html=html.replace(/\b(href|src|action|data-src)="(\/[^"<>]*)"/g, (match,attribute,url)=> {
    if(url.startsWith('//') || /^\/publisher(?:\/|$)/.test(url)) return match;
    // Checkout is shared with the public site, outside the publisher preview.
    if(url === '/order/') return match;
    if(shared.has(url.split('/')[1])) return match;
    return `${attribute}="/publisher${url}"`;
  });
  await writeFile(file,html);
}
const after=await hashes();
if(JSON.stringify(before)!==JSON.stringify(after)) throw new Error('Existing production files changed.');
const report={protectedProductionFiles:protectedFiles.length, unchanged:true,
  publisherPages:files.filter(file=>file.endsWith('.html')).length,
  url:'https://scaleofus.com/publisher/'};
await mkdir(path.join(source,'proof'),{recursive:true});
await writeFile(path.join(source,'proof/deployment-integrity.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report));
