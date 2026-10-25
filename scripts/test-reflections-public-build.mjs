// Uses an isolated source copy and synthetic words. Never edits the real quote list.
import assert from 'node:assert/strict';
import {mkdtemp, cp, mkdir, readFile, writeFile, symlink, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {ReflectionStore} from '../reflections/store.mjs';
import {BOOK, CONSENT_VERSION} from '../reflections/policy.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const fixture = await mkdtemp(path.join(tmpdir(), 'scale-reflections-public-build-'));
const output = process.env.QA_OUTPUT || path.join(root, '.reflections-proof');
const quote = '<img src=x onerror="window.fixtureExecuted=true"> TEST FIXTURE ONLY';
try {
  for (const name of ['src', 'reflections', 'astro.config.mjs', 'site.config.mjs', 'package.json', 'tsconfig.json']) await cp(path.join(root, name), path.join(fixture, name), {recursive:true});
  // The optional, unrelated checkout prototype exists only in some workspaces.
  try { await cp(path.join(root, 'review'), path.join(fixture, 'review'), {recursive:true}); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  await mkdir(path.join(fixture, 'development/publisher-site-v10'), {recursive:true});
  await cp(path.join(root, 'development/publisher-site-v10/src'), path.join(fixture, 'development/publisher-site-v10/src'), {recursive:true});
  for (const name of ['node_modules', 'public']) await symlink(path.join(root, name), path.join(fixture, name));
  const store = new ReflectionStore(path.join(fixture, 'private'));
  const base = {book:BOOK, language:'en', text:quote, name:'<b>FIXTURE</b>', quoteConsent:true, consentVersion:CONSENT_VERSION};
  await store.submit(base, randomUUID());
  await store.submit({...base, text:'PRIVATE_FIXTURE_DO_NOT_PUBLISH', quoteConsent:false}, randomUUID());
  const [record] = await store.list();
  const publicFile = path.join(fixture, 'src/content/public-reflections.json');
  await store.exportPublic(publicFile);
  const build = () => execFileSync(process.execPath, [path.join(root, 'node_modules/astro/bin/astro.mjs'), 'build'], {cwd:fixture, env:{...process.env, CHECKOUT_REVIEW:'0'}, encoding:'utf8', stdio:'pipe'});
  build();
  for (const route of ['reflections']) {
    const html = await readFile(path.join(fixture, 'dist', route, 'index.html'), 'utf8');
    assert(html.includes('TEST FIXTURE ONLY')); assert(!html.includes(quote));
    assert(html.includes('&lt;img')); assert(html.includes('&lt;b&gt;FIXTURE&lt;/b&gt;'));
    assert(!html.includes('PRIVATE_FIXTURE_DO_NOT_PUBLISH')); assert(!html.includes(record.requestId));
    assert(!html.includes(record.createdAt));
  }
  const approved = JSON.parse(await readFile(publicFile)); approved[0].text = 'Changed words inconsistent with original consent';
  await writeFile(publicFile, JSON.stringify(approved));
  let rejected = false;
  try { build(); } catch (error) { rejected = `${error.stdout}\n${error.stderr}`.includes('Public reflection differs'); }
  assert(rejected, 'Build must reject text inconsistent with its consent record.');
  await mkdir(output, {recursive:true});
  await writeFile(path.join(output, 'public-build-results.json'), JSON.stringify({consentedReflectionRenderedWithoutApproval:true, rawHtmlEscaped:true, unconsentedFixtureAbsent:true, privateMetadataAbsent:true, tamperedConsentRecordBuildRejected:true, isolatedFixtureRemoved:true}, null, 2));
  console.log('PASS isolated public build: consented reflection rendered without personal approval, HTML escaped, private words excluded, tampered consent record rejected.');
} finally { await rm(fixture, {recursive:true, force:true}); }
