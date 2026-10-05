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
const tracked = execFileSync('git', ['ls-files', '-z', 'docs'], {cwd:root, encoding:'utf8'})
  .split('\0').filter(file => file && !file.startsWith('docs/publisher/'));
async function hashes() {
  return Object.fromEntries(await Promise.all(tracked.map(async file =>
    [file, createHash('sha256').update(await readFile(path.join(root,file))).digest('hex')])));
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
for(const file of files.filter(file=>file.endsWith('.html'))) {
  let html=await readFile(file,'utf8');
  html=html.replace(/\b(href|src|action|data-src)="(\/[^"<>]*)"/g, (match,attribute,url)=> {
    if(url.startsWith('//') || /^\/publisher(?:\/|$)/.test(url)) return match;
    if(shared.has(url.split('/')[1])) return match;
    return `${attribute}="/publisher${url}"`;
  });
  await writeFile(file,html);
}
const after=await hashes();
if(JSON.stringify(before)!==JSON.stringify(after)) throw new Error('Existing production files changed.');
const report={protectedProductionFiles:tracked.length, unchanged:true,
  publisherPages:files.filter(file=>file.endsWith('.html')).length,
  url:'https://scaleofus.com/publisher/'};
await mkdir(path.join(source,'proof'),{recursive:true});
await writeFile(path.join(source,'proof/deployment-integrity.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report));
